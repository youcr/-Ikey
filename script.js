console.log('script.js started'); // 追加

// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const cameraUploadButton = document.getElementById('cameraUploadButton');
const cameraCaptureInput = document.getElementById('cameraCaptureInput');
const imageCanvas = document.getElementById('imageCanvas');
const imageContainer = document.getElementById('imageContainer');
const previewCanvas = document.getElementById('previewCanvas');
const correctButton = document.getElementById('correctButton');
const reCorrectButton = document.getElementById('reCorrectButton');
const downloadButton = document.getElementById('downloadButton');
const detectCornersButton = document.getElementById('detectCornersButton');
const resetMarkersButton = document.getElementById('resetMarkersButton');
const aspectRatioSelect = document.getElementById('aspectRatioSelect');
const magnifier = document.getElementById('magnifier');
const magnifierCanvas = document.getElementById('magnifierCanvas');
const autoAdjustButton = document.getElementById('autoAdjustButton'); // 自動調整ボタンを追加
const resetBrightnessButton = document.getElementById('resetBrightnessButton'); // 明るさリセットボタンを追加

// New Detection Parameter Elements
const toggleDetectionParamsButton = document.getElementById('toggleDetectionParamsButton');
const detectionParamsSection = document.getElementById('detectionParamsSection');
console.log('toggleDetectionParamsButton:', toggleDetectionParamsButton); // 追加
console.log('detectionParamsSection:', detectionParamsSection); // 追加
const cannyThreshold1Slider = document.getElementById('cannyThreshold1Slider');
const cannyThreshold2Slider = document.getElementById('cannyThreshold2Slider');
const dilateKernelSizeSlider = document.getElementById('dilateKernelSizeSlider');
const minAreaRatioSlider = document.getElementById('minAreaRatioSlider');
const significantAreaRatioSlider = document.getElementById('significantAreaRatioSlider');

const cannyThreshold1Value = document.getElementById('cannyThreshold1Value');
const cannyThreshold2Value = document.getElementById('cannyThreshold2Value');
const dilateKernelSizeValue = document.getElementById('dilateKernelSizeValue');
const minAreaRatioValue = document.getElementById('minAreaRatioValue');
const significantAreaRatioValue = document.getElementById('significantAreaRatioValue');


// Sliders and value displays
const toggleImageAdjustmentButton = document.getElementById('toggleImageAdjustmentButton'); // 追加
const imageAdjustmentSection = document.getElementById('imageAdjustmentSection'); // 追加
const brightnessSlider = document.getElementById('brightnessSlider');
const contrastSlider = document.getElementById('contrastSlider');
const saturationSlider = document.getElementById('saturationSlider');
const sharpenSlider = document.getElementById('sharpenSlider');
const morphologySlider = document.getElementById('morphologySlider');
const binarizationToggle = document.getElementById('binarizationToggle');
const otsuToggle = document.getElementById('otsuToggle');
const thresholdSlider = document.getElementById('thresholdSlider');
const grayscaleToggle = document.getElementById('grayscaleToggle');

const brightnessValue = document.getElementById('brightnessValue');
const contrastValue = document.getElementById('contrastValue');
const saturationValue = document.getElementById('saturationValue');
const sharpenValue = document.getElementById('sharpenValue');
const morphologyValue = document.getElementById('morphologyValue');
const thresholdValue = document.getElementById('thresholdValue');
const binarizationOptions = document.getElementById('binarizationOptions');


// UI Sections
const croppingSection = document.getElementById('cropping-section');
const adjustmentSection = document.getElementById('adjustment-section');
console.log('adjustmentSection:', adjustmentSection); // 追加
const downloadFooter = document.getElementById('download-footer');
// Feedback elements
const loader = document.getElementById('loader');
const errorMessage = document.getElementById('error-message');
const errorText = document.getElementById('error-text');

// State variables
let cvReady = false;
let originalImage = null;
let srcMat = null;
let correctedMat = null;
let displayMat = null;

// Adjustment slider drag state flags
// Adjustment slider drag state flags (不再使用)
// let isDraggingBrightness = false;
// let isDraggingContrast = false;
// let isDraggingSaturation = false;
// let isDraggingSharpen = false;
// let isDraggingMorphology = false;
// let isDraggingThreshold = false;

const MAX_CANVAS_WIDTH = 800;
let markers = [];
let activeMarker = null;
let imageScale = 1;
let currentAspectRatio = 297 / 210;
let originalImageAspectRatio = 1;

const MAGNIFIER_SIZE_PX = 200; // 拡大表示領域のCSSでのサイズ (例: w-50 h-50 -> 200px)
const MAGNIFIER_ZOOM_LEVEL = 3; // 拡大率


// --- Utility Functions ---
function showLoader(show) {
    loader.classList.toggle('hidden', !show);
}

function showUserMessage(message, isError = false) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    errorMessage.classList.toggle('bg-red-200', isError);
    errorMessage.classList.toggle('border-red-500', isError);
    errorMessage.classList.toggle('text-red-700', isError);
    errorMessage.classList.toggle('bg-gray-200', !isError);
    errorMessage.classList.toggle('border-gray-400', !isError);
    errorMessage.classList.toggle('text-gray-700', !isError);
    document.querySelector('#error-message strong').textContent = isError ? "エラー:" : "情報:";
    console.log(isError ? "Error:" : "Info:", message);
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 5000);
}

function padZero(num) {
    return String(num).padStart(2, '0');
}

function getFormattedTimestamp() {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = padZero(now.getMonth() + 1);
    const day = padZero(now.getDate());
    const hours = padZero(now.getHours());
    const minutes = padZero(now.getMinutes());
    const seconds = padZero(now.getSeconds());
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// --- OpenCV Initialization ---
window.onOpenCvReady = function() {
    console.log('OpenCV.js is ready.');
    cv = window.cv;
    cvReady = true;
    showLoader(false);
    if (originalImage && !detectCornersButton.disabled) {
         detectCornersButton.disabled = !cvReady;
    }
}

// --- Image Source Handling (Common Logic) ---
function handleImageFile(file) {
    if (!cvReady) {
        showUserMessage("OpenCV.jsの読み込みが完了していません。少し待ってから再度お試しください。", true);
        imageUpload.value = "";
        cameraCaptureInput.value = "";
        return;
    }
    if (file) {
        originalImage = new Image();
        originalImage.onload = async () => {
            if (srcMat) srcMat.delete();
            srcMat = cv.imread(originalImage);
            originalImageAspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;

            setupCroppingCanvas();

            croppingSection.style.display = 'block'; // hiddenクラスではなくstyle.displayで制御
            adjustmentSection.style.display = 'none'; // hiddenクラスではなくstyle.displayで制御
            downloadFooter.style.display = 'none'; // hiddenクラスではなくstyle.displayで制御
            correctButton.disabled = false;
            resetMarkersButton.disabled = false;
            detectCornersButton.disabled = !cvReady;

            if (cvReady && srcMat) {
                showLoader(true);
                // 初期ロード時の自動検出はデフォルトパラメータを使用
                const success = await runCornerDetectionLogic(false, {
                    cannyThreshold1: parseInt(cannyThreshold1Slider.value),
                    cannyThreshold2: parseInt(cannyThreshold2Slider.value),
                    dilateKernelSize: parseInt(dilateKernelSizeSlider.value),
                    minAreaRatio: parseFloat(minAreaRatioSlider.value),
                    significantAreaRatio: parseFloat(significantAreaRatioSlider.value)
                });
                showLoader(false);
                if (success) {
                    showUserMessage("四角を自動検出しました。");
                    if (markers && markers.length === 4) {
                        const orderedMarkers = orderPointsForTransform(markers); // マーカーを正しい順序に並べ替え
                        const w1 = Math.hypot(orderedMarkers[1].x - orderedMarkers[0].x, orderedMarkers[1].y - orderedMarkers[0].y);
                        const w2 = Math.hypot(orderedMarkers[2].x - orderedMarkers[3].x, orderedMarkers[2].y - orderedMarkers[3].y);
                        const h1 = Math.hypot(orderedMarkers[3].x - orderedMarkers[0].x, orderedMarkers[3].y - orderedMarkers[0].y);
                        const h2 = Math.hypot(orderedMarkers[2].x - orderedMarkers[1].x, orderedMarkers[2].y - orderedMarkers[1].y);

                        const estimatedWidth = (w1 + w2) / 2;
                        const estimatedHeight = (h1 + h2) / 2;

                        if (estimatedHeight > 0) {
                            const detectedAspectRatio = estimatedWidth / estimatedHeight;
                            const a4LandscapeRatio = 297 / 210; // 約1.414
                            const a4PortraitRatio = 210 / 297; // 約0.707

                            // 検出されたアスペクト比が1より大きいか小さいかで大まかに判定
                            if (detectedAspectRatio > 1) {
                                // 横向きの可能性が高い
                                // A4横向きとA4縦向きの比率との差を比較
                                const diffA4L = Math.abs(detectedAspectRatio - a4LandscapeRatio);
                                const diffA4P = Math.abs(detectedAspectRatio - a4PortraitRatio);

                                if (diffA4L < diffA4P) {
                                    aspectRatioSelect.value = "A4L";
                                    currentAspectRatio = a4LandscapeRatio;
                                    showUserMessage("検出された四角形に基づいて、アスペクト比をA4横に設定しました。");
                                } else {
                                     // 検出された比率が1より大きいが、A4縦向きの方が近い場合も考慮
                                    aspectRatioSelect.value = "A4P";
                                    currentAspectRatio = a4PortraitRatio;
                                    showUserMessage("検出された四角形に基づいて、アスペクト比をA4縦に設定しました。");
                                }
                            } else {
                                // 縦向きの可能性が高い (または正方形に近い)
                                const diffA4L = Math.abs(detectedAspectRatio - a4LandscapeRatio);
                                const diffA4P = Math.abs(detectedAspectRatio - a4PortraitRatio);

                                if (diffA4P < diffA4L) {
                                    aspectRatioSelect.value = "A4P";
                                    currentAspectRatio = a4PortraitRatio;
                                    showUserMessage("検出された四角形に基づいて、アスペクト比をA4縦に設定しました。");
                                } else {
                                    // 検出された比率が1以下だが、A4横向きの方が近い場合も考慮
                                    aspectRatioSelect.value = "A4L";
                                    currentAspectRatio = a4LandscapeRatio;
                                    showUserMessage("検出された四角形に基づいて、アスペクト比をA4横に設定しました。");
                                }
                            }
                        } else {
                             // 高さがない場合はデフォルトのA4横に設定
                            aspectRatioSelect.value = "A4L";
                            currentAspectRatio = 297 / 210;
                            showUserMessage("検出された四角形の高さが0のため、アスペクト比をデフォルトのA4横に設定しました。");
                        }
                    } else {
                        // マーカーが4つ見つからなかった場合はデフォルトのA4横に設定
                        aspectRatioSelect.value = "A4L";
                        currentAspectRatio = 297 / 210;
                        showUserMessage("四角の自動検出に失敗しました。手動で調整してください。アスペクト比はデフォルトのA4横に設定されました。");
                    }
                } else {
                    // 自動検出自体が失敗した場合もデフォルトのA4横に設定
                    aspectRatioSelect.value = "A4L";
                    currentAspectRatio = 297 / 210;
                    showUserMessage("四角の自動検出に失敗しました。手動で調整してください。アスペクト比はデフォルトのA4横に設定されました。");
                }
            } else {
                console.log("OpenCV not ready or srcMat not available for auto-detection on load.");
                 // OpenCVまたはsrcMatがない場合もデフォルトのA4横に設定
                aspectRatioSelect.value = "A4L";
                currentAspectRatio = 297 / 210;
            }
        };
        originalImage.onerror = () => {
            showUserMessage("画像の読み込みに失敗しました。", true);
            if (srcMat) { srcMat.delete(); srcMat = null; }
            originalImage = null;
        };
        originalImage.src = URL.createObjectURL(file);
    }
}

// --- Event Listeners for Image Sources ---
imageUpload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
});

cameraUploadButton.addEventListener('click', () => {
    cameraCaptureInput.click();
});

cameraCaptureInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        handleImageFile(file);
    }
    event.target.value = null;
});


// --- Cropping Canvas and Marker Setup ---
function setupCroppingCanvas() {
    const ctx = imageCanvas.getContext('2d');
    const imgWidth = originalImage.naturalWidth;
    const imgHeight = originalImage.naturalHeight;

    imageScale = MAX_CANVAS_WIDTH / imgWidth;
    if (imgHeight * imageScale > window.innerHeight * 0.6) {
        imageScale = (window.innerHeight * 0.6) / imgHeight;
    }
    if (imageScale > 1) imageScale = 1;

    imageCanvas.width = imgWidth * imageScale;
    imageCanvas.height = imgHeight * imageScale;

    ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
    initMarkers();
}

function getMarkerStyleCoords(logicalX, logicalY) {
    if (!imageCanvas || !imageContainer) return { left: 0, top: 0 };

    const canvasRect = imageCanvas.getBoundingClientRect();
    const scaleXLogicalToDisplay = canvasRect.width / imageCanvas.width;
    const scaleYLogicalToDisplay = canvasRect.height / imageCanvas.height; // Fix: Should be imageCanvas.height
    const displayXOnCanvas = logicalX * scaleXLogicalToDisplay;
    const displayYOnCanvas = logicalY * scaleYLogicalToDisplay;
    const styleX = imageCanvas.offsetLeft + displayXOnCanvas;
    const styleY = imageCanvas.offsetTop + displayYOnCanvas;
    return { left: styleX, top: styleY };
}

function initMarkers() {
    markers.forEach(m => m.element.remove());
    markers = [];

    const canvasWidth = imageCanvas.width;
    const canvasHeight = imageCanvas.height;
    const a4LandscapeRatio = 297 / 210;
    let rectWidth, rectHeight;

    if ((canvasWidth / canvasHeight) > a4LandscapeRatio) {
        rectHeight = canvasHeight * 0.8;
        rectWidth = rectHeight * a4LandscapeRatio;
    } else {
        rectWidth = canvasWidth * 0.8;
        rectHeight = rectWidth / a4LandscapeRatio;
    }
    rectWidth = Math.min(rectWidth, canvasWidth);
    rectHeight = Math.min(rectHeight, canvasHeight);
    const offsetX = (canvasWidth - rectWidth) / 2;
    const offsetY = (canvasHeight - rectHeight) / 2;

    const initialPositions = [
        { x: offsetX, y: offsetY },
        { x: offsetX + rectWidth, y: offsetY },
        { x: offsetX + rectWidth, y: offsetY + rectHeight },
        { x: offsetX, y: offsetY + rectHeight },
    ];
    initialPositions.forEach((pos, index) => createMarker(pos.x, pos.y, index));
}

function createMarker(logicalX, logicalY, index) {
    const markerElement = document.createElement('div');
    markerElement.classList.add('marker', 'touch-manipulation');
    const styleCoords = getMarkerStyleCoords(logicalX, logicalY);
    markerElement.style.left = `${styleCoords.left}px`;
    markerElement.style.top = `${styleCoords.top}px`;
    markerElement.dataset.index = index;
    imageContainer.appendChild(markerElement);
    const markerObj = { x: logicalX, y: logicalY, element: markerElement, id: index };
    const existingMarkerIndex = markers.findIndex(m => m.id === index);
    if (existingMarkerIndex > -1) markers[existingMarkerIndex] = markerObj;
    else markers.push(markerObj);
    markerElement.addEventListener('mousedown', startDrag);
    markerElement.addEventListener('touchstart', startDrag, { passive: false });
}

resetMarkersButton.addEventListener('click', () => {
    if (!originalImage) return;
    initMarkers();
});

function startDrag(e) {
    e.preventDefault();
    const index = parseInt(e.target.dataset.index);
    activeMarker = markers.find(m => m.id === index);
    if (!activeMarker) return;

    activeMarker.element.classList.add('active');
    magnifier.classList.remove('hidden'); // 拡大表示を開始

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

    // 初回描画 (ドラッグ開始時に一度更新)
    updateMagnifier(e);
}

function drag(e) {
    if (!activeMarker) return;
    e.preventDefault();
    const canvasRect = imageCanvas.getBoundingClientRect();
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX; clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX; clientY = e.clientY;
    }
    let displayXOnCanvas = clientX - canvasRect.left;
    let displayYOnCanvas = clientY - canvasRect.top;
    const scaleDisplayToLogicalX = imageCanvas.width / canvasRect.width;
    const scaleDisplayToLogicalY = imageCanvas.height / canvasRect.height;
    let logicalX = displayXOnCanvas * scaleDisplayToLogicalX;
    let logicalY = displayYOnCanvas * scaleDisplayToLogicalY;
    logicalX = Math.max(0, Math.min(logicalX, imageCanvas.width));
    logicalY = Math.max(0, Math.min(logicalY, imageCanvas.height));
    activeMarker.x = logicalX;
    activeMarker.y = logicalY;
    const styleCoords = getMarkerStyleCoords(logicalX, logicalY);
    activeMarker.element.style.left = `${styleCoords.left}px`;
    activeMarker.element.style.top = `${styleCoords.top}px`;
    updateMagnifier(e); // マーカー移動のたびに拡大表示を更新
}

function endDrag() {
    if (activeMarker) activeMarker.element.classList.remove('active');
    activeMarker = null;
    magnifier.classList.add('hidden'); // 拡大表示を終了
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
}

function updateMagnifier(e) {
    if (!activeMarker || !originalImage) return;

    const magnCtx = magnifierCanvas.getContext('2d');
    magnifierCanvas.width = MAGNIFIER_SIZE_PX * window.devicePixelRatio; // 高解像度対応
    magnifierCanvas.height = MAGNIFIER_SIZE_PX * window.devicePixelRatio;
    magnCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // ウィンドウサイズと中央座標を取得
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;

    // ドラッグ位置を取得 (タッチイベントとマウスイベントに対応)
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    // 拡大鏡のオフセット (ポインターから少し離す)
    const offsetX = 20; // 水平方向のオフセット
    const offsetY = 20; // 垂直方向のオフセット

    // ドラッグ位置に基づいて拡大鏡の表示位置を決定
    if (clientX > centerX && clientY < centerY) { // 右上
        magnifier.style.left = `${clientX - MAGNIFIER_SIZE_PX - offsetX}px`;
        magnifier.style.top = `${clientY + offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    } else if (clientX < centerX && clientY < centerY) { // 左上
        magnifier.style.left = `${clientX + offsetX}px`;
        magnifier.style.top = `${clientY + offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    } else if (clientX > centerX && clientY > centerY) { // 右下
        magnifier.style.left = `${clientX - MAGNIFIER_SIZE_PX - offsetX}px`;
        magnifier.style.top = `${clientY - MAGNIFIER_SIZE_PX - offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    } else { // 左下 (または中央付近)
        magnifier.style.left = `${clientX + offsetX}px`;
        magnifier.style.top = `${clientY - MAGNIFIER_SIZE_PX - offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    }

    // ソース画像のどの部分を拡大するか
    // activeMarker.x, activeMarker.y は imageCanvas 上の論理座標
    // これを originalImage 上の座標に変換する
    const sourceX = activeMarker.x / imageScale;
    const sourceY = activeMarker.y / imageScale;

    // 拡大表示する領域の幅・高さ (ソース画像上でのピクセル数)
    const sourceWidth = MAGNIFIER_SIZE_PX / MAGNIFIER_ZOOM_LEVEL;
    const sourceHeight = MAGNIFIER_SIZE_PX / MAGNIFIER_ZOOM_LEVEL;

    // 拡大表示する領域の左上座標 (ソース画像上)
    const sx = sourceX - sourceWidth / 2;
    const sy = sourceY - sourceHeight / 2;

    magnCtx.fillStyle = 'lightgray'; // 画像範囲外の場合の背景色
    magnCtx.fillRect(0, 0, MAGNIFIER_SIZE_PX, MAGNIFIER_SIZE_PX);

    // originalImage から指定範囲を magnifierCanvas に拡大描画
    magnCtx.drawImage(
        originalImage,
        sx, sy, sourceWidth, sourceHeight, // ソース画像の切り出し元矩形
        0, 0, MAGNIFIER_SIZE_PX, MAGNIFIER_SIZE_PX // 描画先canvasの矩形 (拡大される)
    );
}

function performCorrection() {
    if (correctedMat) correctedMat.delete();
    correctedMat = new cv.Mat();
    const srcPointsForTransform = markers.map(p => ({ x: p.x / imageScale, y: p.y / imageScale }));
    const orderedSrcMarkerPoints = orderPointsForTransform(srcPointsForTransform);
    const flatSrcPoints = orderedSrcMarkerPoints.reduce((acc, p) => acc.concat([p.x, p.y]), []);
    let previewTargetWidth = Math.min(originalImage.naturalWidth, MAX_CANVAS_WIDTH);
    let previewTargetHeight = previewTargetWidth / currentAspectRatio;
    const maxPreviewDisplayHeight = window.innerHeight * 0.65;
    if (previewTargetHeight > maxPreviewDisplayHeight) {
        previewTargetHeight = maxPreviewDisplayHeight;
        previewTargetWidth = previewTargetHeight * currentAspectRatio;
    }
    if (previewTargetWidth > MAX_CANVAS_WIDTH) {
        previewTargetWidth = MAX_CANVAS_WIDTH;
        previewTargetHeight = previewTargetWidth / currentAspectRatio;
    }
    previewCanvas.width = Math.round(previewTargetWidth);
    previewCanvas.height = Math.round(previewTargetHeight);
    const dstPoints = [0, 0, previewCanvas.width - 1, 0, previewCanvas.width - 1, previewCanvas.height - 1, 0, previewCanvas.height - 1];
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, flatSrcPoints);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, dstPoints);
    let M = cv.getPerspectiveTransform(srcTri, dstTri);
    let dsize = new cv.Size(previewCanvas.width, previewCanvas.height);
    cv.warpPerspective(srcMat, correctedMat, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());
    srcTri.delete(); dstTri.delete(); M.delete();
}

correctButton.addEventListener('click', async () => {
    if (!srcMat || markers.length !== 4) {
        showUserMessage("画像が読み込まれていないか、マーカーが正しく設定されていません。", true);
        return;
    }
    showLoader(true);
    await new Promise(resolve => setTimeout(resolve, 50));
    try {
        performCorrection();
        applyAllAdjustments(correctedMat, previewCanvas, true);
        croppingSection.style.display = 'none'; // hiddenクラスではなくstyle.displayで制御
        adjustmentSection.style.display = 'block'; // hiddenクラスではなくstyle.displayで制御
        // adjustmentParamsSection.style.display = 'block'; // 調整パラメータセクションを表示 (デフォルト非表示のため削除)
        downloadFooter.style.display = 'block'; // hiddenクラスではなくstyle.displayで制御
    } catch (err) {
        showUserMessage("台形補正に失敗しました: " + err.message, true);
        console.error(err);
    } finally {
        showLoader(false);
    }
});

reCorrectButton.addEventListener('click', () => {
    croppingSection.style.display = 'block'; // hiddenクラスではなくstyle.displayで制御
    adjustmentSection.style.display = 'none'; // hiddenクラスではなくstyle.displayで制御
    downloadFooter.style.display = 'none'; // hiddenクラスではなくstyle.displayで制御
    const ctx = imageCanvas.getContext('2d');
    ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
    markers.forEach(m => {
        const styleCoords = getMarkerStyleCoords(m.x, m.y);
        m.element.style.left = `${styleCoords.left}px`;
        m.element.style.top = `${styleCoords.top}px`;
        m.element.style.display = 'block';
    });
});

function orderPointsForTransform(points) {
    const sorted = [...points].sort((a,b) => a.y - b.y);
    const top = sorted.slice(0,2).sort((a,b) => a.x - b.x);
    const bottom = sorted.slice(2,4).sort((a,b) => a.x - b.x);
    return [top[0], top[1], bottom[1], bottom[0]];
}

function applyAllAdjustments(sourceMat, targetCanvas, isForPreview) {
    if (!sourceMat || sourceMat.empty()) {
        if (isForPreview) showUserMessage("補正元画像がありません。", true);
        return null;
    }
    let workingMat = sourceMat.clone();
    let tempProcessMat;
    try {
        if (grayscaleToggle.checked) {
            if (workingMat.channels() === 4) cv.cvtColor(workingMat, workingMat, cv.COLOR_RGBA2GRAY);
            else if (workingMat.channels() === 3) cv.cvtColor(workingMat, workingMat, cv.COLOR_RGB2GRAY);
        }
        let brightness = parseFloat(brightnessSlider.value);
        let contrastVal = parseFloat(contrastSlider.value);
        workingMat.convertTo(workingMat, -1, contrastVal, brightness);
        if (!grayscaleToggle.checked && workingMat.channels() >= 3) {
            let saturation = parseFloat(saturationSlider.value);
            if (saturation !== 1.0) {
                let hsvMat = new cv.Mat();
                let tempRgbForHsv = new cv.Mat();
                if (workingMat.channels() === 4) cv.cvtColor(workingMat, tempRgbForHsv, cv.COLOR_RGBA2RGB);
                else tempRgbForHsv = workingMat.clone();
                cv.cvtColor(tempRgbForHsv, hsvMat, cv.COLOR_RGB2HSV);
                let channels = new cv.MatVector(); cv.split(hsvMat, channels);
                let sChannel = channels.get(1);
                for (let i = 0; i < sChannel.rows; i++) {
                    for (let j = 0; j < sChannel.cols; j++) {
                        let val = sChannel.ucharPtr(i, j)[0];
                        val = Math.min(255, Math.max(0, val * saturation));
                        sChannel.ucharPtr(i, j)[0] = val;
                    }
                }
                cv.merge(channels, hsvMat);
                cv.cvtColor(hsvMat, tempRgbForHsv, cv.COLOR_HSV2RGB);
                if (workingMat.channels() === 4) cv.cvtColor(tempRgbForHsv, workingMat, cv.COLOR_RGB2RGBA);
                else tempRgbForHsv.copyTo(workingMat);
                hsvMat.delete(); channels.delete(); sChannel.delete(); tempRgbForHsv.delete();
            }
        }
        const sharpenLevel = parseInt(sharpenSlider.value);
        if (sharpenLevel > 0 && workingMat.channels() >= 1) {
            let sharpenKernel = cv.matFromArray(3, 3, cv.CV_32F, [0, -1, 0, -1, 5 + sharpenLevel * 0.4, -1, 0, -1, 0]);
            if (workingMat.depth() !== cv.CV_8U) workingMat.convertTo(workingMat, cv.CV_8U, 1, 0);
            cv.filter2D(workingMat, workingMat, cv.CV_8U, sharpenKernel, new cv.Point(-1, -1), 0, cv.BORDER_DEFAULT);
            sharpenKernel.delete();
        }
        const morphValue = parseInt(morphologySlider.value);
        if (morphValue !== 0 && morphValue !== 6) {
            const opType = morphValue <= 5 ? 'erode' : 'dilate';
            const kSize = morphValue <= 5 ? morphValue : morphValue - 6;
            if (kSize > 0) {
                let morphKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(kSize, kSize));
                if (workingMat.channels() !== 1) {
                    tempProcessMat = new cv.Mat();
                    cv.cvtColor(workingMat, tempProcessMat, workingMat.channels() === 4 ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY);
                } else {
                    tempProcessMat = workingMat.clone();
                }
                if (opType === 'erode') cv.erode(tempProcessMat, tempProcessMat, morphKernel);
                else cv.dilate(tempProcessMat, tempProcessMat, morphKernel);
                if (!grayscaleToggle.checked && sourceMat.channels() > 1) {
                     cv.cvtColor(tempProcessMat, workingMat, cv.COLOR_GRAY2RGBA);
                } else {
                    tempProcessMat.copyTo(workingMat);
                }
                if (tempProcessMat !== workingMat && tempProcessMat && !tempProcessMat.isDeleted()) tempProcessMat.delete();
                morphKernel.delete();
            }
        }
        if (binarizationToggle.checked) {
            if (workingMat.channels() !== 1) {
                tempProcessMat = new cv.Mat();
                cv.cvtColor(workingMat, tempProcessMat, workingMat.channels() === 4 ? cv.COLOR_RGBA2GRAY : cv.COLOR_RGB2GRAY);
            } else {
                tempProcessMat = workingMat.clone();
            }
            const threshVal = parseInt(thresholdSlider.value);
            const thresholdType = otsuToggle.checked ? (cv.THRESH_BINARY + cv.THRESH_OTSU) : cv.THRESH_BINARY;
            cv.threshold(tempProcessMat, tempProcessMat, threshVal, 255, thresholdType);
            tempProcessMat.copyTo(workingMat);
            if(tempProcessMat !== workingMat && tempProcessMat && !tempProcessMat.isDeleted()) tempProcessMat.delete();
        }
        if (workingMat.channels() === 1) {
            cv.cvtColor(workingMat, workingMat, cv.COLOR_GRAY2RGBA);
        }
        if (targetCanvas) {
            cv.imshow(targetCanvas, workingMat);
        }
        if (isForPreview) {
            if (displayMat) displayMat.delete();
            displayMat = workingMat.clone();
        }
        return workingMat;
    } catch (err) {
        console.error("Error during image adjustments: ", err);
        if (isForPreview) showUserMessage("画像調整中にエラーが発生しました: " + err.message, true);
        if (workingMat && workingMat !== sourceMat && !workingMat.isDeleted()) workingMat.delete();
        if(tempProcessMat && !tempProcessMat.isDeleted()) tempProcessMat.delete();
        return null;
    } finally {
         if (isForPreview) showLoader(false);
    }
}

aspectRatioSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    switch(value) {
        case "A4L": currentAspectRatio = 297 / 210; break;
        case "A4P": currentAspectRatio = 210 / 297; break;
        case "16:9L": currentAspectRatio = 16 / 9; break;
        case "9:16P": currentAspectRatio = 9 / 16; break;
        case "4:3L": currentAspectRatio = 4 / 3; break;
        case "3:4P": currentAspectRatio = 3 / 4; break;
        case "1:1S": currentAspectRatio = 1 / 1; break;
        case "original": currentAspectRatio = originalImageAspectRatio; break;
        default: currentAspectRatio = 297 / 210;
    }
    if (correctedMat) {
        performCorrection();
        applyAllAdjustments(correctedMat, previewCanvas, true);
    }
});

// Helper function to update value display
function updateSliderValueDisplay(slider, valueDisplay, isMorphology = false, isThreshold = false) {
    if (valueDisplay) {
        if (isMorphology) {
            const val = parseInt(slider.value);
            let text = "なし";
            if (val >= 1 && val <= 5) text = `侵食 (${val})`;
            else if (val >= 7 && val <= 11) text = `膨張 (${val-6})`;
            valueDisplay.textContent = text;
        } else if (isThreshold) {
             valueDisplay.textContent = slider.value;
        }
         else if (slider.id === 'contrastSlider' || slider.id === 'saturationSlider') {
             valueDisplay.textContent = parseFloat(slider.value).toFixed(2);
         }
        else {
            valueDisplay.textContent = slider.value;
        }
    }
}

// Individual event listeners for each adjustment parameter slider

// Brightness Slider
brightnessSlider.addEventListener('input', () => {
    updateSliderValueDisplay(brightnessSlider, brightnessValue);
    // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
});
// Brightness Slider
const handleBrightnessDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true);
brightnessSlider.addEventListener('input', () => {
    updateSliderValueDisplay(brightnessSlider, brightnessValue);
});
brightnessSlider.addEventListener('mousedown', () => {
    brightnessSlider.addEventListener('mousemove', handleBrightnessDrag);
});
brightnessSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // タッチ操作でのスクロールなどを防止
    brightnessSlider.addEventListener('touchmove', handleBrightnessDrag);
}, { passive: false }); // passive: false で preventDefault を有効に
brightnessSlider.addEventListener('mouseup', () => {
    brightnessSlider.removeEventListener('mousemove', handleBrightnessDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});
brightnessSlider.addEventListener('touchend', () => {
    brightnessSlider.removeEventListener('touchmove', handleBrightnessDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

// Contrast Slider
contrastSlider.addEventListener('input', () => {
    updateSliderValueDisplay(contrastSlider, contrastValue);
    // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
});
// Contrast Slider
const handleContrastDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true);
contrastSlider.addEventListener('input', () => {
    updateSliderValueDisplay(contrastSlider, contrastValue);
});
contrastSlider.addEventListener('mousedown', () => {
    contrastSlider.addEventListener('mousemove', handleContrastDrag);
});
contrastSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // タッチ操作でのスクロールなどを防止
    contrastSlider.addEventListener('touchmove', handleContrastDrag);
}, { passive: false }); // passive: false で preventDefault を有効に
contrastSlider.addEventListener('mouseup', () => {
    contrastSlider.removeEventListener('mousemove', handleContrastDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});
contrastSlider.addEventListener('touchend', () => {
    contrastSlider.removeEventListener('touchmove', handleContrastDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

// Saturation Slider
saturationSlider.addEventListener('input', () => {
    updateSliderValueDisplay(saturationSlider, saturationValue);
    // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
});
// Saturation Slider
const handleSaturationDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true);
saturationSlider.addEventListener('input', () => {
    updateSliderValueDisplay(saturationSlider, saturationValue);
});
saturationSlider.addEventListener('mousedown', () => {
    saturationSlider.addEventListener('mousemove', handleSaturationDrag);
});
saturationSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // タッチ操作でのスクロールなどを防止
    saturationSlider.addEventListener('touchmove', handleSaturationDrag);
}, { passive: false }); // passive: false で preventDefault を有効に
saturationSlider.addEventListener('mouseup', () => {
    saturationSlider.removeEventListener('mousemove', handleSaturationDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});
saturationSlider.addEventListener('touchend', () => {
    saturationSlider.removeEventListener('touchmove', handleSaturationDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

// Sharpen Slider
sharpenSlider.addEventListener('input', () => {
    updateSliderValueDisplay(sharpenSlider, sharpenValue);
    // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
});
// Sharpen Slider
const handleSharpenDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true);
sharpenSlider.addEventListener('input', () => {
    updateSliderValueDisplay(sharpenSlider, sharpenValue);
});
sharpenSlider.addEventListener('mousedown', () => {
    sharpenSlider.addEventListener('mousemove', handleSharpenDrag);
});
sharpenSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // タッチ操作でのスクロールなどを防止
    sharpenSlider.addEventListener('touchmove', handleSharpenDrag);
}, { passive: false }); // passive: false で preventDefault を有効に
sharpenSlider.addEventListener('mouseup', () => {
    sharpenSlider.removeEventListener('mousemove', handleSharpenDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});
sharpenSlider.addEventListener('touchend', () => {
    sharpenSlider.removeEventListener('touchmove', handleSharpenDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

// Morphology Slider
morphologySlider.addEventListener('input', () => {
    updateSliderValueDisplay(morphologySlider, morphologyValue, true); // isMorphology = true
    // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
});
// Morphology Slider
const handleMorphologyDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true);
morphologySlider.addEventListener('input', () => {
    updateSliderValueDisplay(morphologySlider, morphologyValue, true); // isMorphology = true
});
morphologySlider.addEventListener('mousedown', () => {
    morphologySlider.addEventListener('mousemove', handleMorphologyDrag);
});
morphologySlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // タッチ操作でのスクロールなどを防止
    morphologySlider.addEventListener('touchmove', handleMorphologyDrag);
}, { passive: false }); // passive: false で preventDefault を有効に
morphologySlider.addEventListener('mouseup', () => {
    morphologySlider.removeEventListener('mousemove', handleMorphologyDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});
morphologySlider.addEventListener('touchend', () => {
    morphologySlider.removeEventListener('touchmove', handleMorphologyDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

// Threshold Slider
thresholdSlider.addEventListener('input', () => {
    updateSliderValueDisplay(thresholdSlider, thresholdValue, false, true); // isThreshold = true
    // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
});
// Threshold Slider
const handleThresholdDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true);
thresholdSlider.addEventListener('input', () => {
    updateSliderValueDisplay(thresholdSlider, thresholdValue, false, true); // isThreshold = true
});
thresholdSlider.addEventListener('mousedown', () => {
    thresholdSlider.addEventListener('mousemove', handleThresholdDrag);
});
thresholdSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); // タッチ操作でのスクロールなどを防止
    thresholdSlider.addEventListener('touchmove', handleThresholdDrag);
}, { passive: false }); // passive: false で preventDefault を有効に
thresholdSlider.addEventListener('mouseup', () => {
    thresholdSlider.removeEventListener('mousemove', handleThresholdDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});
thresholdSlider.addEventListener('touchend', () => {
    thresholdSlider.removeEventListener('touchmove', handleThresholdDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});


// Toggle switches still use 'change' as they are not range sliders
grayscaleToggle.addEventListener('change', () => {
    if(correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

binarizationToggle.addEventListener('change', () => {
    binarizationOptions.classList.toggle('hidden', !binarizationToggle.checked);
    if(correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

otsuToggle.addEventListener('change', () => {
    thresholdSlider.disabled = otsuToggle.checked;
    if(correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true);
});

// Event Listener for toggling detection parameters
toggleDetectionParamsButton.addEventListener('click', () => {
    detectionParamsSection.classList.toggle('hidden');
});
// Event Listener for toggling adjustment parameters
toggleAdjustmentParamsButton.addEventListener('click', () => {
    console.log('toggleAdjustmentParamsButton clicked'); // 追加
    if (adjustmentParamsSection) {
        adjustmentParamsSection.classList.toggle('hidden');
        console.log('adjustmentParamsSection hidden class toggled'); // 追加
    } else {
        console.log('adjustmentParamsSection not found'); // 追加
    }
});

// Helper function for debouncing
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Function to generate and display the detection preview image (grayscale, blurred, edges, dilated)
function generateDetectionPreviewImage(params) {
    if (!srcMat || !cvReady || !imageCanvas) return;

    let gray = null, blurred = null, edges = null, dilated_edges = null;
    let displayPreviewMat = null;

    try {
        // 1. グレースケール変換
        gray = new cv.Mat();
        if (srcMat.channels() === 4) cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY);
        else if (srcMat.channels() === 3) cv.cvtColor(srcMat, gray, cv.COLOR_RGB2GRAY);
        else gray = srcMat.clone(); // すでにグレースケールの場合

        // 2. ガウシアンブラー
        blurred = new cv.Mat();
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // 3. Cannyエッジ検出
        edges = new cv.Mat();
        cv.Canny(blurred, edges, params.cannyThreshold1, params.cannyThreshold2, 3, false);

        // 4. 膨張処理
        dilated_edges = new cv.Mat();
        let dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(params.dilateKernelSize, params.dilateKernelSize));
        cv.dilate(edges, dilated_edges, dilateKernel, new cv.Point(-1, -1), 1);
        dilateKernel.delete();

        // 表示用に元の画像のサイズにリサイズ
        displayPreviewMat = new cv.Mat();
        let dsize = new cv.Size(imageCanvas.width, imageCanvas.height);
        cv.resize(dilated_edges, displayPreviewMat, dsize, 0, 0, cv.INTER_LINEAR);

        // imageCanvasに描画
        cv.imshow(imageCanvas, displayPreviewMat);

    } catch (err) {
        console.error("Error generating detection preview:", err);
        // エラー時は元の画像を表示
        const ctx = imageCanvas.getContext('2d');
        if (originalImage) {
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
        }
    } finally {
        // Matオブジェクトの解放
        if (gray && !gray.isDeleted()) gray.delete();
        if (blurred && !blurred.isDeleted()) blurred.delete();
        if (edges && !edges.isDeleted()) edges.delete();
        if (dilated_edges && !dilated_edges.isDeleted()) dilated_edges.delete();
        if (displayPreviewMat && !displayPreviewMat.isDeleted()) displayPreviewMat.delete();
    }
}


// Function to update the preview canvas with current detection parameters (shows detection process image)
async function updatePreviewWithDetectionParams() {
    if (!srcMat || !cvReady || croppingSection.style.display === 'none') {
        return;
    }

    // ローダーは表示しないか、非常に短時間にする (リアルタイム性を重視)
    // showLoader(true);

    try {
        // 現在のスライダー値を取得
        const detectionParams = {
            cannyThreshold1: parseInt(cannyThreshold1Slider.value),
            cannyThreshold2: parseInt(cannyThreshold2Slider.value),
            dilateKernelSize: parseInt(dilateKernelSizeSlider.value),
            // minAreaRatio と significantAreaRatio はプレビュー生成には不要
        };

        // 白黒の検出プレビュー画像を生成して表示
        generateDetectionPreviewImage(detectionParams);

    } catch (err) {
        console.error("Error updating preview with detection params:", err);
        // エラー発生時は元の画像を表示に戻す (generateDetectionPreviewImage内でも処理されるが念のため)
        const ctx = imageCanvas.getContext('2d');
         if (originalImage) {
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
         }
    } finally {
        // showLoader(false);
    }
}

// デバウンスされたプレビュー更新関数
const debouncedUpdatePreview = debounce(updatePreviewWithDetectionParams, 100); // デバウンス時間を少し短縮 (100ms)

// New Detection Parameter Slider Event Listeners

// Helper function to attach preview event listeners to a slider
function attachDetectionPreviewListeners(slider, valueDisplay) {
    slider.addEventListener('input', () => {
        // inputイベントでは値の表示のみ更新
        if (valueDisplay) {
             if (slider.id === 'minAreaRatioSlider') {
                 valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
             } else {
                 valueDisplay.textContent = slider.value;
             }
        }
        // ドラッグ中のプレビュー更新はmousedown/touchstartと組み合わせる
        // ここではdebouncedUpdatePreview()は呼び出さない
    });

    // ドラッグ開始時: プレビュー表示を開始
    slider.addEventListener('mousedown', () => {
        // デバウンスなしで即時プレビュー更新を開始
        updatePreviewWithDetectionParams();
        // ドラッグ中はinputイベントでもプレビューを更新するように一時的にリスナーを追加
        slider.addEventListener('mousemove', updatePreviewWithDetectionParams);
    });
    slider.addEventListener('touchstart', (e) => {
        e.preventDefault(); // タッチ操作でのスクロールなどを防止
        // デバウンスなしで即時プレビュー更新を開始
        updatePreviewWithDetectionParams();
        // ドラッグ中はinputイベントでもプレビューを更新するように一時的にリスナーを追加
        slider.addEventListener('touchmove', updatePreviewWithDetectionParams);
    }, { passive: false }); // passive: false で preventDefault を有効に

    // ドラッグ終了時: 元の画像に戻す
    const resetPreviewToOriginal = () => {
        if (originalImage && imageCanvas) {
            const ctx = imageCanvas.getContext('2d');
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
        }
        // 一時的に追加したmousemove/touchmoveリスナーを削除
        slider.removeEventListener('mousemove', updatePreviewWithDetectionParams);
        slider.removeEventListener('touchmove', updatePreviewWithDetectionParams);
    };

    slider.addEventListener('mouseup', resetPreviewToOriginal);
    slider.addEventListener('touchend', resetPreviewToOriginal);
}

// Attach listeners to each detection parameter slider
attachDetectionPreviewListeners(cannyThreshold1Slider, cannyThreshold1Value);
attachDetectionPreviewListeners(cannyThreshold2Slider, cannyThreshold2Value);
attachDetectionPreviewListeners(dilateKernelSizeSlider, dilateKernelSizeValue);
attachDetectionPreviewListeners(minAreaRatioSlider, minAreaRatioValue);
attachDetectionPreviewListeners(significantAreaRatioSlider, significantAreaRatioValue);

// 既存のdebouncedUpdatePreview関数は、自動検出ボタンクリック時などに使用するため残しておく
// スライダーのinputイベントからは直接呼ばないように変更


// --- Download (High Resolution) ---
downloadButton.addEventListener('click', async () => {
    if (!srcMat || markers.length !== 4) {
        showUserMessage("元画像がないか、マーカーが正しく設定されていません。", true);
        return;
    }
    showLoader(true);
    downloadButton.disabled = true;
    downloadButton.textContent = "処理中...";

    let downloadCorrectedMatForCleanup = null;
    let processedMatForDownloadForCleanup = null;

    function finalizeDownloadProcess(success = true) {
        if (processedMatForDownloadForCleanup && !processedMatForDownloadForCleanup.isDeleted()) {
            processedMatForDownloadForCleanup.delete();
            processedMatForDownloadForCleanup = null; // Avoid trying to delete again
        }
        if (downloadCorrectedMatForCleanup && !downloadCorrectedMatForCleanup.isDeleted()) {
            downloadCorrectedMatForCleanup.delete();
            downloadCorrectedMatForCleanup = null; // Avoid trying to delete again
        }
        showLoader(false);
        downloadButton.disabled = false;
        downloadButton.textContent = "ダウンロード";
    }

    try {
        const fullResMarkers = markers.map(p => ({ x: p.x / imageScale, y: p.y / imageScale }));
        const orderedFullResSrcPoints = orderPointsForTransform(fullResMarkers);
        const flatFullResSrcPoints = orderedFullResSrcPoints.reduce((acc, p) => acc.concat([p.x, p.y]), []);

        let downloadTargetWidth, downloadTargetHeight;
        const selectedRatioValue = aspectRatioSelect.value;
        const effectiveDownloadAspectRatio = (selectedRatioValue === "original") ? originalImageAspectRatio : currentAspectRatio;
        const w1 = Math.hypot(orderedFullResSrcPoints[1].x - orderedFullResSrcPoints[0].x, orderedFullResSrcPoints[1].y - orderedFullResSrcPoints[0].y);
        const w2 = Math.hypot(orderedFullResSrcPoints[2].x - orderedFullResSrcPoints[3].x, orderedFullResSrcPoints[2].y - orderedFullResSrcPoints[3].y);
        const h1 = Math.hypot(orderedFullResSrcPoints[3].x - orderedFullResSrcPoints[0].x, orderedFullResSrcPoints[3].y - orderedFullResSrcPoints[0].y);
        const h2 = Math.hypot(orderedFullResSrcPoints[2].x - orderedFullResSrcPoints[1].x, orderedFullResSrcPoints[2].y - orderedFullResSrcPoints[1].y);
        const estimatedWidth = (w1 + w2) / 2;
        const estimatedHeight = (h1 + h2) / 2;

        if (selectedRatioValue === "original") {
            downloadTargetWidth = Math.round(estimatedWidth);
            downloadTargetHeight = Math.round(estimatedHeight);
        } else {
            if ((estimatedWidth / estimatedHeight) > effectiveDownloadAspectRatio) {
                downloadTargetWidth = Math.round(estimatedWidth);
                downloadTargetHeight = Math.round(downloadTargetWidth / effectiveDownloadAspectRatio);
            } else {
                downloadTargetHeight = Math.round(estimatedHeight);
                downloadTargetWidth = Math.round(downloadTargetHeight * effectiveDownloadAspectRatio);
            }
        }
        downloadTargetWidth = Math.max(1, downloadTargetWidth);
        downloadTargetHeight = Math.max(1, downloadTargetHeight);

        downloadCorrectedMatForCleanup = new cv.Mat();
        const downloadDstPoints = [0, 0, downloadTargetWidth - 1, 0, downloadTargetWidth - 1, downloadTargetHeight - 1, 0, downloadTargetHeight - 1];
        let srcTriFull = cv.matFromArray(4, 1, cv.CV_32FC2, flatFullResSrcPoints);
        let dstTriFull = cv.matFromArray(4, 1, cv.CV_32FC2, downloadDstPoints);
        let MFull = cv.getPerspectiveTransform(srcTriFull, dstTriFull);
        let dsizeFull = new cv.Size(downloadTargetWidth, downloadTargetHeight);
        cv.warpPerspective(srcMat, downloadCorrectedMatForCleanup, MFull, dsizeFull, cv.INTER_LANCZOS4, cv.BORDER_CONSTANT, new cv.Scalar());
        srcTriFull.delete(); dstTriFull.delete(); MFull.delete();

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = downloadTargetWidth;
        offscreenCanvas.height = downloadTargetHeight;
        processedMatForDownloadForCleanup = applyAllAdjustments(downloadCorrectedMatForCleanup, offscreenCanvas, false);

        if (processedMatForDownloadForCleanup && !processedMatForDownloadForCleanup.empty()) {
            const filenameBase = getFormattedTimestamp();
            const imageMimeType = 'image/jpeg';
            const imageExtension = imageMimeType === 'image/jpeg' ? '.jpg' : '.png';
            const imageFilename = `${filenameBase}${imageExtension}`;

            offscreenCanvas.toBlob((blob) => {
                if (!blob) {
                    showUserMessage("画像のBlob変換に失敗しました。", true);
                    finalizeDownloadProcess(false);
                    return;
                }
                try {
                    const blobUrl = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    link.download = imageFilename;
                    link.target = '_blank'; // Androidでのダウンロード挙動改善を試みる
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
                    finalizeDownloadProcess(true);
                } catch (e) {
                    showUserMessage("画像ダウンロード中にエラーが発生しました: " + e.message, true);
                    console.error("Download link error:", e);
                    finalizeDownloadProcess(false);
                }
            }, imageMimeType, imageMimeType === 'image/jpeg' ? 0.92 : undefined);
        } else {
            showUserMessage("高解像度画像の調整処理に失敗しました。", true);
            finalizeDownloadProcess(false);
        }
    } catch (err) {
        showUserMessage("ダウンロード処理全体でエラー: " + err.message, true);
        console.error("Overall download processing error:", err);
        finalizeDownloadProcess(false);
    }
});

async function runCornerDetectionLogic(showMessages = true, params = {}) { // params引数を追加
    if (!srcMat || !cvReady) {
        if (showMessages) showUserMessage("画像未読み込み、またはOpenCV準備未完了のため自動検出できません。", true);
        return false;
    }
    try {
        // autoDetectCornersOpenCVにパラメータを渡す
        const detectedPointsOriginal = autoDetectCornersOpenCV(params);
        if (detectedPointsOriginal && detectedPointsOriginal.length === 4) {
            const detectedPointsLogicalCanvas = detectedPointsOriginal.map(p => ({ x: p.x * imageScale, y: p.y * imageScale }));
            const orderedCanvasPoints = orderPointsForTransform(detectedPointsLogicalCanvas);
            orderedCanvasPoints.forEach((point, index) => {
                if (markers[index]) {
                    markers[index].x = point.x;
                    markers[index].y = point.y;
                    const styleCoords = getMarkerStyleCoords(point.x, point.y);
                    markers[index].element.style.left = `${styleCoords.left}px`;
                    markers[index].element.style.top = `${styleCoords.top}px`;
                }
            });
            return true;
        } else { return false; }
    } catch (err) {
        if (showMessages) showUserMessage("自動検出中にエラーが発生しました: " + err.message, true);
        console.error("Auto-detect error:", err);
        return false;
    }
}

// 自動検出ボタンクリック時にパラメータを適用して検出を実行
detectCornersButton.addEventListener('click', async () => {
    if (!srcMat || !cvReady) {
        showUserMessage("画像が読み込まれていないか、OpenCVが準備できていません。", true); return;
    }
    showLoader(true);
    detectCornersButton.disabled = true; detectCornersButton.textContent = "検出中...";
    await new Promise(resolve => setTimeout(resolve, 50));

    // スライダーから現在のパラメータ値を取得
    const detectionParams = {
        cannyThreshold1: parseInt(cannyThreshold1Slider.value),
        cannyThreshold2: parseInt(cannyThreshold2Slider.value),
        dilateKernelSize: parseInt(dilateKernelSizeSlider.value),
        minAreaRatio: parseFloat(minAreaRatioSlider.value),
        significantAreaRatio: parseFloat(significantAreaRatioSlider.value)
    };

    // パラメータを渡して検出ロジックを実行
    const success = await runCornerDetectionLogic(true, detectionParams); // runCornerDetectionLogicにパラメータを渡す

    if (success) {
        showUserMessage("四角を自動検出しました。");
    } else {
        showUserMessage("四角の自動検出に失敗しました。手動で調整してください。");
    }
    showLoader(false);
    detectCornersButton.disabled = false; detectCornersButton.textContent = "自動検出";
});


function autoDetectCornersOpenCV(params = {}) { // params引数を追加
    // デフォルトパラメータを設定
    const defaultParams = {
        cannyThreshold1: 75,
        cannyThreshold2: 150,
        dilateKernelSize: 3,
        minAreaRatio: 0.5, // %
        significantAreaRatio: 5 // %
    };
    // 渡されたパラメータでデフォルトを上書き
    const currentParams = { ...defaultParams, ...params };

    // Matオブジェクトの宣言。tryブロック内で初期化し、finallyブロックで解放します。
    let gray = null, blurred = null, edges = null, dilated_edges = null;
    let contours = null, hierarchy = null;
    let approx = null; // approxPolyDPの結果を格納するMat

    try {
        // 元画像srcMatがRGBAの場合を想定 (cv.imreadは通常RGBAで読み込む)
        gray = new cv.Mat();
        cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY, 0);

        // 1. ガウシアンブラーでノイズ低減
        // カーネルサイズは奇数。効果を見ながら調整 (例: 3,3 or 5,5 or 7,7)
        // 数値が大きいほど強くぼかす。
        blurred = new cv.Mat();
        // ガウシアンブラーのカーネルサイズは固定 (5,5) のままにしておく。
        // 調整対象はCanny, 膨張, 面積フィルタリングとする。
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

        // 2. Cannyエッジ検出
        edges = new cv.Mat();
        // パラメータを使用
        cv.Canny(blurred, edges, currentParams.cannyThreshold1, currentParams.cannyThreshold2, 3, false);

        // 3. 膨張処理でエッジを連結し、輪郭を閉じやすくする
        dilated_edges = new cv.Mat();
        // パラメータを使用
        let dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(currentParams.dilateKernelSize, currentParams.dilateKernelSize));
        cv.dilate(edges, dilated_edges, dilateKernel, new cv.Point(-1, -1), 1); // 1 iteration
        dilateKernel.delete(); // カーネルは使用後速やかに解放
        
        // 4. 輪郭検出
        contours = new cv.MatVector();
        hierarchy = new cv.Mat();
        // cv.RETR_EXTERNAL: 最も外側の輪郭のみを検出（紙の輪郭に適している）
        // cv.CHAIN_APPROX_SIMPLE: 輪郭の冗長な点を圧縮し、頂点のみを残す
        cv.findContours(dilated_edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let maxArea = 0;
        let bestApproxPoints = null;
        approx = new cv.Mat(); // approxPolyDPの結果を格納するためにループ外で一度だけ確保

        for (let i = 0; i < contours.size(); ++i) {
            let cnt = contours.get(i); // MatVectorから輪郭を取得
            let area = cv.contourArea(cnt);

            // 面積によるフィルタリング (小さすぎる輪郭を除外)
            // パラメータを使用
            let minAreaFilterThreshold = (srcMat.cols * srcMat.rows) * (currentParams.minAreaRatio / 100); // %を面積に変換
            if (area < minAreaFilterThreshold) {
                // cnt は MatVector が管理しているので、ここでは delete しない
                continue;
            }

            let peri = cv.arcLength(cnt, true);
            // approxPolyDPのepsilonは周囲長に対する割合で固定 (0.02)
            cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

            // 四角形 (approx.rows === 4) で、かつ凸型 (cv.isContourConvex) で、
            // かつ現在見つかっている最大の有効な輪郭より大きいか
            if (approx.rows === 4 && cv.isContourConvex(approx) && area > maxArea) {
                // さらに、紙として妥当な最小面積を満たしているか
                // パラメータを使用
                let significantAreaThreshold = (srcMat.cols * srcMat.rows) * (currentParams.significantAreaRatio / 100); // %を面積に変換
                if (area > significantAreaThreshold) {
                    maxArea = area;
                    // 検出された点の座標を格納 (data32Sは符号付き32bit整数)
                    let currentPoints = [];
                    for (let k = 0; k < approx.rows; ++k) { // approx.rows は4のはず
                        currentPoints.push({ x: approx.data32S[k * 2], y: approx.data32S[k * 2 + 1] });
                    }
                    bestApproxPoints = currentPoints;
                }
            }
            // cnt は MatVector が管理しているので、ここでは delete しない
        }

        if (bestApproxPoints) {
            return bestApproxPoints;
        }
        return null; // 条件に合う輪郭が見つからなかった場合

    } catch (err) {
        console.error("Error in autoDetectCornersOpenCV:", err);
        // エラー発生時は念のため確保したMatを解放しようと試みる
        // (本来はfinallyで処理されるが、エラーの内容によっては到達しない可能性も考慮)
        // dilateKernel は try ブロック内でしか生成されないため、ここでは解放不要
        return null;
    } finally {
        // Matオブジェクトの解放
        if (gray && !gray.isDeleted()) gray.delete();
        if (blurred && !blurred.isDeleted()) blurred.delete();
        if (edges && !edges.isDeleted()) edges.delete();
        if (dilated_edges && !dilated_edges.isDeleted()) dilated_edges.delete();
        if (contours && !contours.isDeleted()) contours.delete();
        if (hierarchy && !hierarchy.isDeleted()) hierarchy.delete();
        if (approx && !approx.isDeleted()) approx.delete();
    }
}

function initApp() {
    console.log('initApp started'); // 追加
    currentAspectRatio = 297 / 210;
    aspectRatioSelect.value = "A4L";
    if (typeof cv === 'undefined' || !cv.imread) {
        showLoader(true);
        console.log("OpenCV.js not fully loaded. Waiting...");
        let attempt = 0;
        const cvLoadCheckInterval = setInterval(() => {
            attempt++;
            console.log(`OpenCV.js load check attempt: ${attempt}`); // 追加
            if (typeof cv !== 'undefined' && cv.imread) {
                console.log('OpenCV.js detected.'); // 追加
                clearInterval(cvLoadCheckInterval);
                if (!cvReady) {
                    console.log('Calling onOpenCvReady from interval.'); // 追加
                    window.onOpenCvReady();
                } else {
                    showLoader(false);
                }
            } else if (attempt > 50) {
                console.log('OpenCV.js load check timed out.'); // 追加
                clearInterval(cvLoadCheckInterval); showLoader(false);
                if (!cvReady) showUserMessage("OpenCV.jsの読み込みに失敗しました。ページをリフレッシュしてください。", true);
            }
        }, 100);
    } else if (!cvReady) {
         console.log('OpenCV.js already detected, calling onOpenCvReady.'); // 追加
         window.onOpenCvReady();
    } else {
        console.log('OpenCV.js and cvReady already set.'); // 追加
        showLoader(false);
    }
    contrastValue.textContent = parseFloat(contrastSlider.value).toFixed(2);
    saturationValue.textContent = parseFloat(saturationSlider.value).toFixed(2);
    sharpenValue.textContent = sharpenSlider.value;
    thresholdValue.textContent = thresholdSlider.value;
    morphologyValue.textContent = "なし";
    binarizationOptions.classList.toggle('hidden', !binarizationToggle.checked);
    thresholdSlider.disabled = otsuToggle.checked;

    // 新しい検出パラメータスライダーの値表示を初期化
    cannyThreshold1Value.textContent = cannyThreshold1Slider.value;
    cannyThreshold2Value.textContent = cannyThreshold2Slider.value;
    dilateKernelSizeValue.textContent = dilateKernelSizeSlider.value;
    minAreaRatioValue.textContent = parseFloat(minAreaRatioSlider.value).toFixed(1);
    significantAreaRatioValue.textContent = significantAreaRatioSlider.value;
}

if (typeof cv !== 'undefined' && typeof cv.onRuntimeInitialized !== 'undefined') {
    cv.onRuntimeInitialized = window.onOpenCvReady;
} else if (typeof cv !== 'undefined' && cv.imread) {
    if (!cvReady) window.onOpenCvReady();
}



// 明るさ・コントラスト自動調整アルゴリズム
function autoAdjustBrightnessContrast() {
    console.log('autoAdjustBrightnessContrast function started'); // シンプルなログを追加
    if (!correctedMat || correctedMat.empty() || !cvReady) {
        showUserMessage("補正済み画像がないため、自動調整できません。", true);
        return;
    }

    showLoader(true);

    // 非同期処理として実行し、UIをブロックしないようにする
    setTimeout(() => {
        let grayMat = new cv.Mat();
        let hist = new cv.Mat();
        let mask = new cv.Mat();
        let channels = new cv.MatVector();
        let histSize = new cv.Mat();
        let ranges = new cv.Mat();

        try {
            // 1. グレースケール変換
            if (correctedMat.channels() === 4) {
                cv.cvtColor(correctedMat, grayMat, cv.COLOR_RGBA2GRAY);
            } else if (correctedMat.channels() === 3) {
                cv.cvtColor(correctedMat, grayMat, cv.COLOR_RGB2GRAY);
            } else {
                grayMat = correctedMat.clone(); // Already grayscale
            }
            console.log('autoAdjustBrightnessContrast: grayMat state after cvtColor:', grayMat ? `empty=${grayMat.empty()}, channels=${grayMat.channels()}, type=${grayMat.type()}` : 'null/undefined');

            // 2. ヒストグラム計算
            channels.push_back(grayMat);
            let histSizeData = [256];
            histSize = new cv.Mat(1, 1, cv.CV_32S);
            histSize.data32S[0] = 256;
            let rangesData = [0, 256];
            ranges = new cv.Mat(1, 2, cv.CV_32F);
            ranges.data32F[0] = 0;
            ranges.data32F[1] = 256;

            console.log('autoAdjustBrightnessContrast: before calcHist - channels size:', channels.size());
            console.log('autoAdjustBrightnessContrast: before calcHist - mask state:', mask ? `empty=${mask.empty()}, channels=${mask.channels()}, type=${mask.type()}` : 'null/undefined');
            console.log('autoAdjustBrightnessContrast: before calcHist - hist state:', hist ? `empty=${hist.empty()}, channels=${hist.channels()}, type=${hist.type()}` : 'null/undefined');
            console.log('autoAdjustBrightnessContrast: before calcHist - histSize data32S[0]:', histSize ? histSize.data32S[0] : 'null/undefined');
            console.log('autoAdjustBrightnessContrast: before calcHist - ranges data32F:', ranges ? `[${ranges.data32F[0]}, ${ranges.data32F[1]}]` : 'null/undefined');

            console.log('autoAdjustBrightnessContrast: before calcHist - histSize data:', histSizeData);
            console.log('autoAdjustBrightnessContrast: before calcHist - ranges data:', rangesData);

            // cv.calcHist(channels, [0], mask, hist, histSize, ranges, false); // エラー原因特定のためコメントアウト

            // 3. ヒストグラム分析と明るさ・コントラスト値の計算
            // ここにビジネス資料に適したアルゴリズムを実装
            // 例: ヒストグラムのピーク、平均、標準偏差、パーセンタイルなどを利用
            // 簡単な例として、ヒストグラムの輝度範囲をストレッチするような考え方
            let minVal = 255, maxVal = 0;
            let totalPixels = grayMat.rows * grayMat.cols;
            let cumulativePixels = 0;
            const lowPercentile = totalPixels * 0.01; // 下位1%を無視
            const highPercentile = totalPixels * 0.99; // 上位1%を無視

            let effectiveMin = 0, effectiveMax = 255;

            // 下位1%の輝度値を探索
            for (let i = 0; i < 256; ++i) {
                cumulativePixels += hist.data32F[i];
                if (cumulativePixels > lowPercentile) {
                    effectiveMin = i;
                    break;
                }
            }

            // 上位1%の輝度値を探索 (累積ピクセルをリセットして逆順に探索)
            cumulativePixels = 0;
            for (let i = 255; i >= 0; --i) {
                 cumulativePixels += hist.data32F[i];
                 if (cumulativePixels > (totalPixels - highPercentile)) { // totalPixels - highPercentile は上位1%の開始点
                     effectiveMax = i;
                     break;
                 }
            }

            // コントラストと明るさの計算 (簡単な線形ストレッチの考え方)
            // 新しい範囲 [0, 255] にマッピング
            // NewValue = (OldValue - effectiveMin) * (255 / (effectiveMax - effectiveMin))
            // これは輝度値に対する変換式。スライダー値に変換する必要がある。

            // コントラスト: 元の範囲 (effectiveMax - effectiveMin) を新しい範囲 (255) に広げる度合い
            // 理想的なコントラストは、effectiveMax - effectiveMin が広いほど高くなる。
            // スライダーの範囲 (0.5 - 2.0) にマッピングすることを考える。
            // 例えば、effectiveMax - effectiveMin が 200 ならコントラスト1.0、100なら0.5、400なら2.0 のように。
            // 変換式: contrast = 0.5 + (effectiveMax - effectiveMin) / 200 * (2.0 - 0.5) + 0.5
            // ただし、effectiveMax === effectiveMin の場合はゼロ除算になるので注意。
            let calculatedContrast = 1.0;
            if (effectiveMax > effectiveMin) {
                 // 範囲 [0, 255] を基準に正規化
                 const normalizedRange = (effectiveMax - effectiveMin) / 255.0;
                 // 正規化された範囲をスライダーの範囲 [0.5, 2.0] にマッピング
                 // 例: normalizedRange 0.5 -> contrast 0.5, normalizedRange 1.0 -> contrast 2.0
                 // 線形マッピング: contrast = 0.5 + (normalizedRange - 0.5) * (1.5 / 0.5)
                 // simplified: contrast = 0.5 + (normalizedRange - 0.5) * 3
                 // さらに調整: normalizedRange が小さいほどコントラストを上げる必要がある。
                 // 逆比率で考える: contrast = 0.5 + (1.0 - normalizedRange) * 1.5
                 // これだと normalizedRange 1.0 で contrast 0.5 になってしまう。
                 // effectiveMax - effectiveMin が大きいほどコントラストを上げたい。
                 // コントラスト計算の調整: 輝度範囲が広いほどコントラストを上げるが、極端にならないように調整
                 // 輝度範囲の中央値 128 を基準に、範囲が広いほどコントラストを上げる
                 // calculatedContrast = 1.0 + (effectiveMax - effectiveMin - 128) / 128.0 * 0.5;
                 // 上記だと effectiveMax - effectiveMin = 0 の時に 1.0 + (-128)/128 * 0.5 = 1.0 - 0.5 = 0.5
                 // effectiveMax - effectiveMin = 255 の時に 1.0 + (127)/128 * 0.5 = 1.0 + 0.99 * 0.5 = 1.0 + 0.495 = 1.495
                 // これで輝度範囲が狭い場合にコントラストが上がりすぎるのを抑制できる可能性がある。
                 calculatedContrast = 1.0 + (effectiveMax - effectiveMin - 128) / 128.0 * 0.5;

                 // スライダーの範囲 [0.5, 2.0] にクランプ
                 calculatedContrast = Math.max(0.5, Math.min(2.0, calculatedContrast));
            }

            // 明るさ: ヒストグラムの中央値や平均値が128に近づくように調整
            // 現在のヒストグラムの中央値または平均値を計算
            let mean = 0;
            for(let i = 0; i < 256; ++i) {
                mean += hist.data32F[i] * i;
            }
            mean /= totalPixels;

            // 目標の平均輝度 (例: 128) と現在の平均輝度の差を明るさ調整値に変換
            // 目標値 128 から現在の平均値を引いた差を明るさスライダーの範囲 [-100, 100] にマッピング
            // 差が 0 なら明るさ 0
            // 差が 128 (最大) なら明るさ 100
            // 差が -128 (最小) なら明るさ -100
            // calculatedBrightness = (128 - mean) / 128 * 100
            let calculatedBrightness = (128 - mean) / 128.0 * 100.0;
            // スライダーの範囲 [-100, 100] にクランプ
            calculatedBrightness = Math.max(-100, Math.min(100, calculatedBrightness));


            console.log(`Calculated Brightness: ${calculatedBrightness.toFixed(2)}, Calculated Contrast: ${calculatedContrast.toFixed(2)}`);

            // 4. 計算した値をスライダーにセット
            if (!isFinite(calculatedBrightness)) {
                console.warn("Calculated brightness is not finite, using default 0.");
                calculatedBrightness = 0;
            }
            brightnessSlider.value = calculatedBrightness;
            if (!isFinite(calculatedContrast)) {
                console.warn("Calculated contrast is not finite, using default 1.0.");
                calculatedContrast = 1.0;
            }
            contrastSlider.value = calculatedContrast;

            // 5. スライダーの値表示を更新し、画像を再描画
            updateSliderValueDisplay(brightnessSlider, brightnessValue);
            updateSliderValueDisplay(contrastSlider, contrastValue);

            // applyAllAdjustmentsを呼び出してプレビューを更新
            applyAllAdjustments(correctedMat, previewCanvas, true);

            showUserMessage("明るさ・コントラストを自動調整しました。");

        } catch (err) {
            console.error("Error during auto adjustment:", err);
            showUserMessage("自動調整中にエラーが発生しました: " + err.message, true);
        } finally {
            // Matオブジェクトの解放
            if (grayMat && !grayMat.isDeleted()) grayMat.delete();
            if (hist && !hist.isDeleted()) hist.delete();
            if (mask && !mask.isDeleted()) mask.delete();
            if (channels && !channels.isDeleted()) channels.delete();
            if (histSize && !histSize.isDeleted()) histSize.delete();
            if (ranges && !ranges.isDeleted()) ranges.delete();
            showLoader(false);
        }
    }, 100); // 遅延時間を長くしてログ出力の機会を増やす
}

// 自動調整ボタンのイベントリスナーを追加
if (autoAdjustButton) {
    autoAdjustButton.addEventListener('click', autoAdjustBrightnessContrast);
} else {
    console.error("Auto adjust button not found.");
}

// 明るさリセットボタンのイベントリスナーを追加
if (resetBrightnessButton) {
    resetBrightnessButton.addEventListener('click', () => {
        console.log('resetBrightnessButton clicked'); // 追加
        if (!correctedMat || correctedMat.empty() || !cvReady) {
            showUserMessage("補正済み画像がないため、リセットできません。", true);
            return;
        }

        // 明るさとコントラストを初期値にリセット
        brightnessSlider.value = "0";
        contrastSlider.value = "1.0";

        // スライダーの値表示を更新
        updateSliderValueDisplay(brightnessSlider, brightnessValue);
        updateSliderValueDisplay(contrastSlider, contrastValue);

        // 画像にリセットされた調整を適用して再描画
        applyAllAdjustments(correctedMat, previewCanvas, true);

        showUserMessage("明るさ・コントラストをリセットしました。");
    });
} else {
    console.error("Reset brightness button not found.");
}

window.addEventListener('DOMContentLoaded', initApp);
