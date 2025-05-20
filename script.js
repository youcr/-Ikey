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


const MAX_CANVAS_WIDTH = 800;
let markers = [];
let activeMarker = null;
let imageScale = 1;
let currentAspectRatio = 297 / 210;
let originalImageAspectRatio = 1;

const MAGNIFIER_SIZE_PX = 200; 
const MAGNIFIER_ZOOM_LEVEL = 3; 


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
    console.log('onOpenCvReady fired. Setting cv and cvReady. Current cvReady state:', cvReady, 'window.cv type:', typeof window.cv);
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
    console.log('handleImageFile called. cvReady:', cvReady, 'cv object:', typeof cv);
    if (!cvReady) {
        showUserMessage("OpenCV.jsの読み込みが完了していません。少し待ってから再度お試しください。", true);
        imageUpload.value = "";
        cameraCaptureInput.value = "";
        return;
    }
    if (file) {
        originalImage = new Image();
        originalImage.onload = async () => {
    try {
        console.log('originalImage.onload started. cvReady:', cvReady, 'cv object:', typeof cv);
        showLoader(true); // Show loader at the beginning of the process

        if (srcMat && !srcMat.isDeleted()) { // Ensure srcMat exists and is not already deleted before deleting
            srcMat.delete();
        }
        if (typeof cv === 'undefined' || !cv.imread || !cv.cvtColor || !cv.Canny || !cv.warpPerspective || !cv.getPerspectiveTransform || !cv.matFromArray || !cv.Point || !cv.Size || !cv.INTER_LINEAR || !cv.BORDER_CONSTANT || !cv.moments || !cv.arcLength || !cv.approxPolyDP || !cv.contourArea || !cv.isContourConvex || !cv.findContours || !cv.RETR_EXTERNAL || !cv.CHAIN_APPROX_SIMPLE) {
            throw new Error("OpenCV components are not available or cv object is not fully initialized.");
        }
        console.log('Attempting cv.imread. cv object type:', typeof cv, 'cv.imread type:', (typeof cv !== 'undefined' ? typeof cv.imread : 'cv undefined'));
        srcMat = cv.imread(originalImage);

        if (!srcMat || srcMat.empty()) {
            throw new Error("OpenCV could not read the image data. The file might be corrupted or in an unsupported format.");
        }

        // If imread is successful, and srcMat is valid:
        originalImageAspectRatio = originalImage.naturalWidth / originalImage.naturalHeight;

        croppingSection.style.display = 'block';
        adjustmentSection.style.display = 'none';
        downloadFooter.style.display = 'none';

        setupCroppingCanvas(); // This function draws the image on canvas and initializes markers

        correctButton.disabled = false;
        resetMarkersButton.disabled = false;
        detectCornersButton.disabled = !cvReady; // Depends on OpenCV readiness

        if (cvReady && srcMat && !srcMat.isDeleted()) { // Check srcMat again in case setupCroppingCanvas or other steps could invalidate it (unlikely here but good practice)
            // No separate showLoader(true/false) needed here for runCornerDetectionLogic
            const detectionParams = {
                cannyThreshold1: parseInt(cannyThreshold1Slider.value),
                cannyThreshold2: parseInt(cannyThreshold2Slider.value),
                dilateKernelSize: parseInt(dilateKernelSizeSlider.value),
                minAreaRatio: parseFloat(minAreaRatioSlider.value),
                significantAreaRatio: parseFloat(significantAreaRatioSlider.value)
            };
            const success = await runCornerDetectionLogic(true, detectionParams, cv, srcMat);

            if (success) {
                showUserMessage("四角を自動検出しました。"); // "Corners auto-detected."
                if (markers && markers.length === 4) {
                    const orderedMarkers = orderPointsForTransform(markers);
                    const w1 = Math.hypot(orderedMarkers[1].x - orderedMarkers[0].x, orderedMarkers[1].y - orderedMarkers[0].y);
                    const w2 = Math.hypot(orderedMarkers[2].x - orderedMarkers[3].x, orderedMarkers[2].y - orderedMarkers[3].y);
                    const h1 = Math.hypot(orderedMarkers[3].x - orderedMarkers[0].x, orderedMarkers[3].y - orderedMarkers[0].y);
                    const h2 = Math.hypot(orderedMarkers[2].x - orderedMarkers[1].x, orderedMarkers[2].y - orderedMarkers[1].y);

                    const estimatedWidth = (w1 + w2) / 2;
                    const estimatedHeight = (h1 + h2) / 2;

                    if (estimatedHeight > 0) {
                        const detectedAspectRatio = estimatedWidth / estimatedHeight;
                        const a4LandscapeRatio = 297 / 210;
                        const a4PortraitRatio = 210 / 297;

                        // Determine best fit for aspect ratio based on detected shape
                        if (detectedAspectRatio > 1) { // Likely landscape
                            if (Math.abs(detectedAspectRatio - a4LandscapeRatio) < Math.abs(detectedAspectRatio - a4PortraitRatio)) {
                                aspectRatioSelect.value = "A4L"; currentAspectRatio = a4LandscapeRatio;
                                showUserMessage("検出された四角形に基づいて、アスペクト比をA4横に設定しました。");
                            } else {
                                aspectRatioSelect.value = "A4P"; currentAspectRatio = a4PortraitRatio;
                                showUserMessage("検出された四角形に基づいて、アスペクト比をA4縦に設定しました。");
                            }
                        } else { // Likely portrait or square
                             if (Math.abs(detectedAspectRatio - a4PortraitRatio) < Math.abs(detectedAspectRatio - a4LandscapeRatio)) {
                                aspectRatioSelect.value = "A4P"; currentAspectRatio = a4PortraitRatio;
                                showUserMessage("検出された四角形に基づいて、アスペクト比をA4縦に設定しました。");
                            } else {
                                aspectRatioSelect.value = "A4L"; currentAspectRatio = a4LandscapeRatio;
                                showUserMessage("検出された四角形に基づいて、アスペクト比をA4横に設定しました。");
                            }
                        }
                    } else {
                        aspectRatioSelect.value = "A4L"; currentAspectRatio = 297 / 210;
                        showUserMessage("検出された四角形の高さが0のため、アスペクト比をデフォルトのA4横に設定しました。");
                    }
                } else { // Markers not 4, or some other issue post-detection success
                    aspectRatioSelect.value = "A4L"; currentAspectRatio = 297 / 210;
                    showUserMessage("四角の自動検出に一部成功しましたが、マーカーの数が不正です。手動調整を推奨します。アスペクト比はA4横です。");
                }
            } else { // runCornerDetectionLogic returned false
                aspectRatioSelect.value = "A4L"; currentAspectRatio = 297 / 210;
                showUserMessage("四角の自動検出に失敗しました。手動で調整してください。アスペクト比はデフォルトのA4横に設定されました。");
            }
        } else if (srcMat && !srcMat.isDeleted() && !cvReady) { // srcMat loaded, but OpenCV not ready
            console.log("OpenCV not ready for auto-detection on load, but image is loaded.");
            aspectRatioSelect.value = "A4L";
            currentAspectRatio = 297 / 210;
            showUserMessage("画像は読み込まれましたが、OpenCVの準備ができていないため自動検出はスキップされました。手動で調整し、OpenCVの読み込み完了後に再試行してください。");
        } else if (!srcMat || srcMat.isDeleted()) {
            // This case should ideally be caught by the throw new Error earlier if srcMat is null/empty
            // but as a fallback if something else clears srcMat.
            console.error("srcMat became invalid before corner detection step.");
            showUserMessage("画像の読み込み中に問題が発生しました。再度お試しください。", true);
        }

    } catch (error) {
        console.error("Error in image loading/initial processing:", error);
        showUserMessage(`処理エラー: ${error.message || '不明なエラー'}。別の画像で試すか、ページを再読み込みしてください。 (Processing error: ${error.message || 'Unknown error'}. Please try a different image or reload the page.)`, true);

        if (srcMat && !srcMat.isDeleted()) {
            srcMat.delete();
        }
        srcMat = null;
        // originalImage is the HTMLImageElement, don't nullify it here as it's the source of the event.
        // Its src is already set. If we need to clear it, other logic might be needed.

        if (croppingSection) croppingSection.style.display = 'none';
        if (adjustmentSection) adjustmentSection.style.display = 'none';
        if (downloadFooter) downloadFooter.style.display = 'none';

        if (imageUpload) imageUpload.value = ""; // Reset file input to allow re-upload of same file
        if (cameraCaptureInput) cameraCaptureInput.value = "";

        if (correctButton) correctButton.disabled = true;
        if (resetMarkersButton) resetMarkersButton.disabled = true;
        if (detectCornersButton) detectCornersButton.disabled = true;

    } finally {
        showLoader(false); // Ensure loader is always hidden, regardless of success or failure
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
    const scaleYLogicalToDisplay = canvasRect.height / imageCanvas.height; 
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
    magnifier.classList.remove('hidden'); 

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchend', endDrag);

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
    updateMagnifier(e); 
}

function endDrag() {
    if (activeMarker) activeMarker.element.classList.remove('active');
    activeMarker = null;
    magnifier.classList.add('hidden'); 
    document.removeEventListener('mousemove', drag);
    document.removeEventListener('touchmove', drag);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchend', endDrag);
}

function updateMagnifier(e) {
    if (!activeMarker || !originalImage) return;

    const magnCtx = magnifierCanvas.getContext('2d');
    magnifierCanvas.width = MAGNIFIER_SIZE_PX * window.devicePixelRatio; 
    magnifierCanvas.height = MAGNIFIER_SIZE_PX * window.devicePixelRatio;
    magnCtx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const centerX = windowWidth / 2;
    const centerY = windowHeight / 2;

    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
    } else {
        clientX = e.clientX;
        clientY = e.clientY;
    }

    const offsetX = 20; 
    const offsetY = 20; 

    if (clientX > centerX && clientY < centerY) { 
        magnifier.style.left = `${clientX - MAGNIFIER_SIZE_PX - offsetX}px`;
        magnifier.style.top = `${clientY + offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    } else if (clientX < centerX && clientY < centerY) { 
        magnifier.style.left = `${clientX + offsetX}px`;
        magnifier.style.top = `${clientY + offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    } else if (clientX > centerX && clientY > centerY) { 
        magnifier.style.left = `${clientX - MAGNIFIER_SIZE_PX - offsetX}px`;
        magnifier.style.top = `${clientY - MAGNIFIER_SIZE_PX - offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    } else { 
        magnifier.style.left = `${clientX + offsetX}px`;
        magnifier.style.top = `${clientY - MAGNIFIER_SIZE_PX - offsetY}px`;
        magnifier.style.right = 'auto';
        magnifier.style.bottom = 'auto';
    }

    const sourceX = activeMarker.x / imageScale;
    const sourceY = activeMarker.y / imageScale;

    const sourceWidth = MAGNIFIER_SIZE_PX / MAGNIFIER_ZOOM_LEVEL;
    const sourceHeight = MAGNIFIER_SIZE_PX / MAGNIFIER_ZOOM_LEVEL;

    const sx = sourceX - sourceWidth / 2;
    const sy = sourceY - sourceHeight / 2;

    magnCtx.fillStyle = 'lightgray'; 
    magnCtx.fillRect(0, 0, MAGNIFIER_SIZE_PX, MAGNIFIER_SIZE_PX);

    magnCtx.drawImage(
        originalImage,
        sx, sy, sourceWidth, sourceHeight, 
        0, 0, MAGNIFIER_SIZE_PX, MAGNIFIER_SIZE_PX 
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
        croppingSection.style.display = 'none'; 
        adjustmentSection.style.display = 'block'; 
        downloadFooter.style.display = 'block'; 
    } catch (err) {
        showUserMessage("台形補正に失敗しました: " + err.message, true);
        console.error(err);
    } finally {
        showLoader(false);
    }
});

reCorrectButton.addEventListener('click', () => {
    croppingSection.style.display = 'block'; 
    adjustmentSection.style.display = 'none'; 
    downloadFooter.style.display = 'none'; 
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

const handleBrightnessDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true); 
brightnessSlider.addEventListener('input', () => {
    updateSliderValueDisplay(brightnessSlider, brightnessValue);
});
brightnessSlider.addEventListener('mousedown', () => {
    brightnessSlider.addEventListener('mousemove', handleBrightnessDrag);
});
brightnessSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    brightnessSlider.addEventListener('touchmove', handleBrightnessDrag);
}, { passive: false }); 
brightnessSlider.addEventListener('mouseup', () => {
    brightnessSlider.removeEventListener('mousemove', handleBrightnessDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});
brightnessSlider.addEventListener('touchend', () => {
    brightnessSlider.removeEventListener('touchmove', handleBrightnessDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});

const handleContrastDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true); 
contrastSlider.addEventListener('input', () => {
    updateSliderValueDisplay(contrastSlider, contrastValue);
});
contrastSlider.addEventListener('mousedown', () => {
    contrastSlider.addEventListener('mousemove', handleContrastDrag);
});
contrastSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    contrastSlider.addEventListener('touchmove', handleContrastDrag);
}, { passive: false }); 
contrastSlider.addEventListener('mouseup', () => {
    contrastSlider.removeEventListener('mousemove', handleContrastDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});
contrastSlider.addEventListener('touchend', () => {
    contrastSlider.removeEventListener('touchmove', handleContrastDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});

const handleSaturationDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true); 
saturationSlider.addEventListener('input', () => {
    updateSliderValueDisplay(saturationSlider, saturationValue);
});
saturationSlider.addEventListener('mousedown', () => {
    saturationSlider.addEventListener('mousemove', handleSaturationDrag);
});
saturationSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    saturationSlider.addEventListener('touchmove', handleSaturationDrag);
}, { passive: false }); 
saturationSlider.addEventListener('mouseup', () => {
    saturationSlider.removeEventListener('mousemove', handleSaturationDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});
saturationSlider.addEventListener('touchend', () => {
    saturationSlider.removeEventListener('touchmove', handleSaturationDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});

const handleSharpenDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true); 
sharpenSlider.addEventListener('input', () => {
    updateSliderValueDisplay(sharpenSlider, sharpenValue);
});
sharpenSlider.addEventListener('mousedown', () => {
    sharpenSlider.addEventListener('mousemove', handleSharpenDrag);
});
sharpenSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    sharpenSlider.addEventListener('touchmove', handleSharpenDrag);
}, { passive: false }); 
sharpenSlider.addEventListener('mouseup', () => {
    sharpenSlider.removeEventListener('mousemove', handleSharpenDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});
sharpenSlider.addEventListener('touchend', () => {
    sharpenSlider.removeEventListener('touchmove', handleSharpenDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});

const handleMorphologyDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true); 
morphologySlider.addEventListener('input', () => {
    updateSliderValueDisplay(morphologySlider, morphologyValue, true); 
});
morphologySlider.addEventListener('mousedown', () => {
    morphologySlider.addEventListener('mousemove', handleMorphologyDrag);
});
morphologySlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    morphologySlider.addEventListener('touchmove', handleMorphologyDrag);
}, { passive: false }); 
morphologySlider.addEventListener('mouseup', () => {
    morphologySlider.removeEventListener('mousemove', handleMorphologyDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});
morphologySlider.addEventListener('touchend', () => {
    morphologySlider.removeEventListener('touchmove', handleMorphologyDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});

const handleThresholdDrag = () => applyAllAdjustments(correctedMat, previewCanvas, true); 
thresholdSlider.addEventListener('input', () => {
    updateSliderValueDisplay(thresholdSlider, thresholdValue, false, true); 
});
thresholdSlider.addEventListener('mousedown', () => {
    thresholdSlider.addEventListener('mousemove', handleThresholdDrag);
});
thresholdSlider.addEventListener('touchstart', (e) => {
    e.preventDefault(); 
    thresholdSlider.addEventListener('touchmove', handleThresholdDrag);
}, { passive: false }); 
thresholdSlider.addEventListener('mouseup', () => {
    thresholdSlider.removeEventListener('mousemove', handleThresholdDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});
thresholdSlider.addEventListener('touchend', () => {
    thresholdSlider.removeEventListener('touchmove', handleThresholdDrag);
    if (correctedMat) applyAllAdjustments(correctedMat, previewCanvas, true); 
});

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

toggleDetectionParamsButton.addEventListener('click', () => {
    detectionParamsSection.classList.toggle('hidden');
});
toggleAdjustmentParamsButton.addEventListener('click', () => {
    console.log('toggleAdjustmentParamsButton clicked'); 
    if (adjustmentParamsSection) {
        adjustmentParamsSection.classList.toggle('hidden');
        console.log('adjustmentParamsSection hidden class toggled'); 
    } else {
        console.log('adjustmentParamsSection not found'); 
    }
});

function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

function generateDetectionPreviewImage(params) {
    if (!srcMat || !cvReady || !imageCanvas) return; 

    let gray = null, blurred = null, edges = null, dilated_edges = null;
    let displayPreviewMat = null;

    try {
        gray = new cv.Mat(); 
        if (srcMat.channels() === 4) cv.cvtColor(srcMat, gray, cv.COLOR_RGBA2GRAY); 
        else if (srcMat.channels() === 3) cv.cvtColor(srcMat, gray, cv.COLOR_RGB2GRAY); 
        else gray = srcMat.clone(); 

        blurred = new cv.Mat(); 
        cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT); 

        edges = new cv.Mat(); 
        cv.Canny(blurred, edges, params.cannyThreshold1, params.cannyThreshold2, 3, false); 

        dilated_edges = new cv.Mat(); 
        let dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(params.dilateKernelSize, params.dilateKernelSize)); 
        cv.dilate(edges, dilated_edges, dilateKernel, new cv.Point(-1, -1), 1); 
        dilateKernel.delete();

        displayPreviewMat = new cv.Mat(); 
        let dsize = new cv.Size(imageCanvas.width, imageCanvas.height); 
        cv.resize(dilated_edges, displayPreviewMat, dsize, 0, 0, cv.INTER_LINEAR); 

        cv.imshow(imageCanvas, displayPreviewMat); 

    } catch (err) {
        console.error("Error generating detection preview:", err);
        const ctx = imageCanvas.getContext('2d');
        if (originalImage) {
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
        }
    } finally {
        if (gray && !gray.isDeleted()) gray.delete();
        if (blurred && !blurred.isDeleted()) blurred.delete();
        if (edges && !edges.isDeleted()) edges.delete();
        if (dilated_edges && !dilated_edges.isDeleted()) dilated_edges.delete();
        if (displayPreviewMat && !displayPreviewMat.isDeleted()) displayPreviewMat.delete();
    }
}

async function updatePreviewWithDetectionParams() {
    if (!srcMat || !cvReady || croppingSection.style.display === 'none') { 
        return;
    }
    try {
        const detectionParams = {
            cannyThreshold1: parseInt(cannyThreshold1Slider.value),
            cannyThreshold2: parseInt(cannyThreshold2Slider.value),
            dilateKernelSize: parseInt(dilateKernelSizeSlider.value),
        };
        generateDetectionPreviewImage(detectionParams);
    } catch (err) {
        console.error("Error updating preview with detection params:", err);
        const ctx = imageCanvas.getContext('2d');
         if (originalImage) {
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
         }
    }
}

const debouncedUpdatePreview = debounce(updatePreviewWithDetectionParams, 100); 

function attachDetectionPreviewListeners(slider, valueDisplay) {
    slider.addEventListener('input', () => {
        if (valueDisplay) {
             if (slider.id === 'minAreaRatioSlider') {
                 valueDisplay.textContent = parseFloat(slider.value).toFixed(1);
             } else {
                 valueDisplay.textContent = slider.value;
             }
        }
    });
    slider.addEventListener('mousedown', () => {
        updatePreviewWithDetectionParams();
        slider.addEventListener('mousemove', updatePreviewWithDetectionParams);
    });
    slider.addEventListener('touchstart', (e) => {
        e.preventDefault(); 
        updatePreviewWithDetectionParams();
        slider.addEventListener('touchmove', updatePreviewWithDetectionParams);
    }, { passive: false }); 
    const resetPreviewToOriginal = () => {
        if (originalImage && imageCanvas) {
            const ctx = imageCanvas.getContext('2d');
            ctx.drawImage(originalImage, 0, 0, imageCanvas.width, imageCanvas.height);
        }
        slider.removeEventListener('mousemove', updatePreviewWithDetectionParams);
        slider.removeEventListener('touchmove', updatePreviewWithDetectionParams);
    };
    slider.addEventListener('mouseup', resetPreviewToOriginal);
    slider.addEventListener('touchend', resetPreviewToOriginal);
}

attachDetectionPreviewListeners(cannyThreshold1Slider, cannyThreshold1Value);
attachDetectionPreviewListeners(cannyThreshold2Slider, cannyThreshold2Value);
attachDetectionPreviewListeners(dilateKernelSizeSlider, dilateKernelSizeValue);
attachDetectionPreviewListeners(minAreaRatioSlider, minAreaRatioValue);
attachDetectionPreviewListeners(significantAreaRatioSlider, significantAreaRatioValue);

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
            processedMatForDownloadForCleanup = null; 
        }
        if (downloadCorrectedMatForCleanup && !downloadCorrectedMatForCleanup.isDeleted()) {
            downloadCorrectedMatForCleanup.delete();
            downloadCorrectedMatForCleanup = null; 
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
                    link.target = '_blank'; 
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

async function runCornerDetectionLogic(showMessages = true, params = {}, cv, srcMat) { 
    if (!srcMat || !cvReady) { 
        if (showMessages) showUserMessage("画像未読み込み、またはOpenCV準備未完了のため自動検出できません。", true);
        return false;
    }
    try {
        const detectedPointsOriginal = autoDetectCornersOpenCV(cv, srcMat, params);
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

detectCornersButton.addEventListener('click', async () => {
    if (!srcMat || !cvReady) { 
        showUserMessage("画像が読み込まれていないか、OpenCVが準備できていません。", true); return;
    }
    showLoader(true);
    detectCornersButton.disabled = true; detectCornersButton.textContent = "検出中...";
    await new Promise(resolve => setTimeout(resolve, 50));

    const detectionParams = {
        cannyThreshold1: parseInt(cannyThreshold1Slider.value),
        cannyThreshold2: parseInt(cannyThreshold2Slider.value),
        dilateKernelSize: parseInt(dilateKernelSizeSlider.value),
        minAreaRatio: parseFloat(minAreaRatioSlider.value),
        significantAreaRatio: parseFloat(significantAreaRatioSlider.value)
    };

    const success = await runCornerDetectionLogic(true, detectionParams, cv, srcMat); 

    if (success) {
        showUserMessage("四角を自動検出しました。");
    } else {
        showUserMessage("四角の自動検出に失敗しました。手動で調整してください。");
    }
    showLoader(false);
    detectCornersButton.disabled = false; detectCornersButton.textContent = "自動検出";
});


// --- Corner Detection Strategies ---

function processGrayscale(cv, mat) {
    const gray = new cv.Mat();
    if (mat.channels() === 4) {
        cv.cvtColor(mat, gray, cv.COLOR_RGBA2GRAY);
    } else if (mat.channels() === 3) {
        cv.cvtColor(mat, gray, cv.COLOR_RGB2GRAY);
    } else {
        mat.copyTo(gray); // Already grayscale or single channel
    }
    return gray;
}

function processChannel(cv, mat, channelIndex) {
    if (mat.channels() < 3) { // Needs at least 3 channels (RGB or RGBA)
        console.warn(`Strategy: Channel ${channelIndex} - Input mat has fewer than 3 channels.`);
        return null; // Or return grayscale as fallback? For now, null.
    }
    const channels = new cv.MatVector();
    cv.split(mat, channels);
    const channelMat = channels.get(channelIndex).clone(); // Clone the extracted channel
    channels.delete();
    return channelMat;
}

function processEnhancedGrayscale(cv, mat) {
    const gray = processGrayscale(cv, mat); // Reuse grayscale processing
    let enhancedGray = new cv.Mat();
    try {
        // Try CLAHE first
        if (cv.createCLAHE) {
            const clahe = cv.createCLAHE(2.0, new cv.Size(8, 8));
            clahe.apply(gray, enhancedGray);
            clahe.delete();
        } else {
            // Fallback to equalizeHist if createCLAHE is not available
            cv.equalizeHist(gray, enhancedGray);
        }
    } catch (e) {
        console.error("Error during contrast enhancement, falling back to simple equalizeHist:", e);
        if (!enhancedGray.isDeleted()) enhancedGray.delete(); // Clean up if partially created
        enhancedGray = new cv.Mat(); // Re-initialize
        cv.equalizeHist(gray, enhancedGray); // Try basic equalizeHist
    }
    gray.delete(); // Delete the intermediate gray mat
    return enhancedGray;
}


function autoDetectCornersOpenCV(cv, srcMat, params = {}) {
    const defaultParams = {
        cannyThreshold1: 75,
        cannyThreshold2: 150,
        dilateKernelSize: 3,
        minAreaRatio: 0.5,
        significantAreaRatio: 5
    };
    const currentParams = { ...defaultParams, ...params };

    const strategies = [
        { name: "baseline_grayscale", processFunc: (m) => processGrayscale(cv, m) },
        { name: "red_channel", processFunc: (m) => processChannel(cv, m, 0) }, // R=0 for RGBA
        { name: "green_channel", processFunc: (m) => processChannel(cv, m, 1) }, // G=1 for RGBA
        { name: "blue_channel", processFunc: (m) => processChannel(cv, m, 2) }, // B=2 for RGBA
        { name: "enhanced_grayscale", processFunc: (m) => processEnhancedGrayscale(cv, m) },
    ];

    for (const strategy of strategies) {
        console.log(`Attempting strategy: ${strategy.name}`);
        let processedMat = null;
        let blurred = null;
        let edges = null;
        let dilated_edges = null;
        let contours = null;
        let hierarchy = null;
        let approx = null;

        try {
            processedMat = strategy.processFunc(srcMat);
            if (!processedMat || processedMat.empty()) {
                console.log(`Strategy ${strategy.name} produced no image.`);
                if (processedMat && !processedMat.isDeleted()) processedMat.delete();
                continue; // Try next strategy
            }
            
            // Common detection logic
            blurred = new cv.Mat();
            cv.GaussianBlur(processedMat, blurred, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

            edges = new cv.Mat();
            cv.Canny(blurred, edges, currentParams.cannyThreshold1, currentParams.cannyThreshold2, 3, false);

            dilated_edges = new cv.Mat();
            let dilateKernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(currentParams.dilateKernelSize, currentParams.dilateKernelSize));
            cv.dilate(edges, dilated_edges, dilateKernel, new cv.Point(-1, -1), 1);
            dilateKernel.delete(); 

            contours = new cv.MatVector();
            hierarchy = new cv.Mat();
            cv.findContours(dilated_edges, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

            approx = new cv.Mat(); 
            for (let i = 0; i < contours.size(); ++i) {
                let cnt = contours.get(i);
                let peri = cv.arcLength(cnt, true);
                cv.approxPolyDP(cnt, approx, 0.02 * peri, true);

                if (approx.rows === 4 && cv.isContourConvex(approx)) {
                    let area = cv.contourArea(approx);
                    let processedImageArea = processedMat.cols * processedMat.rows;
                    let minAreaFilterThreshold = processedImageArea * (currentParams.minAreaRatio / 100);
                    let significantAreaThreshold = processedImageArea * (currentParams.significantAreaRatio / 100);

                    if (area >= minAreaFilterThreshold && area >= significantAreaThreshold) {
                        console.log(`Strategy ${strategy.name} found valid contour.`);
                        let validPoints = [];
                        for (let k = 0; k < approx.rows; ++k) {
                            validPoints.push({ x: approx.data32S[k * 2], y: approx.data32S[k * 2 + 1] });
                        }
                        // Clean up before returning
                        if (processedMat && !processedMat.isDeleted()) processedMat.delete();
                        if (blurred && !blurred.isDeleted()) blurred.delete();
                        if (edges && !edges.isDeleted()) edges.delete();
                        if (dilated_edges && !dilated_edges.isDeleted()) dilated_edges.delete();
                        if (contours && !contours.isDeleted()) contours.delete();
                        if (hierarchy && !hierarchy.isDeleted()) hierarchy.delete();
                        if (approx && !approx.isDeleted()) approx.delete();
                        cnt.delete(); // cnt is from contours.get(i), needs explicit delete if loop is exited.
                        return validPoints;
                    }
                }
                cnt.delete(); // Delete contour if not used
            }
        } catch (err) {
            console.error(`Error in strategy ${strategy.name}:`, err);
        } finally {
            if (processedMat && !processedMat.isDeleted()) processedMat.delete();
            if (blurred && !blurred.isDeleted()) blurred.delete();
            if (edges && !edges.isDeleted()) edges.delete();
            if (dilated_edges && !dilated_edges.isDeleted()) dilated_edges.delete();
            if (contours && !contours.isDeleted()) contours.delete();
            if (hierarchy && !hierarchy.isDeleted()) hierarchy.delete();
            if (approx && !approx.isDeleted()) approx.delete();
        }
    }
    console.log("All strategies failed to find valid corners.");
    return null; 
}


function initApp() {
    console.log('initApp started'); 
    currentAspectRatio = 297 / 210;
    aspectRatioSelect.value = "A4L";
    if (typeof cv === 'undefined' || !cv.imread) { 
        showLoader(true);
        console.log("OpenCV.js not fully loaded. Waiting...");
        let attempt = 0;
        const cvLoadCheckInterval = setInterval(() => {
            attempt++;
            console.log(`OpenCV.js load check attempt: ${attempt}`); 
            if (typeof cv !== 'undefined' && cv.imread) { 
                console.log('OpenCV.js detected.'); 
                clearInterval(cvLoadCheckInterval);
                if (!cvReady) {
                    console.log('Calling onOpenCvReady from interval.'); 
                    window.onOpenCvReady();
                } else {
                    showLoader(false);
                }
            } else if (attempt > 50) {
                console.log('OpenCV.js load check timed out.'); 
                clearInterval(cvLoadCheckInterval); showLoader(false);
                if (!cvReady) showUserMessage("OpenCV.jsの読み込みに失敗しました。ページをリフレッシュしてください。", true);
            }
        }, 100);
    } else if (!cvReady) {
         console.log('OpenCV.js already detected, calling onOpenCvReady.'); 
         window.onOpenCvReady();
    } else {
        console.log('OpenCV.js and cvReady already set.'); 
        showLoader(false);
    }
    contrastValue.textContent = parseFloat(contrastSlider.value).toFixed(2);
    saturationValue.textContent = parseFloat(saturationSlider.value).toFixed(2);
    sharpenValue.textContent = sharpenSlider.value;
    thresholdValue.textContent = thresholdSlider.value;
    morphologyValue.textContent = "なし";
    binarizationOptions.classList.toggle('hidden', !binarizationToggle.checked);
    thresholdSlider.disabled = otsuToggle.checked;

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

function autoAdjustBrightnessContrast() {
    console.log('autoAdjustBrightnessContrast function started'); 
    if (!correctedMat || correctedMat.empty() || !cvReady) { 
        showUserMessage("補正済み画像がないため、自動調整できません。", true);
        return;
    }

    showLoader(true);

    setTimeout(() => {
        let grayMat = new cv.Mat(); 
        let hist = new cv.Mat(); 
        let mask = new cv.Mat(); 
        let channels = new cv.MatVector(); 
        let histSizeMat = new cv.Mat(); // Renamed to avoid conflict with histSize array
        let rangesMat = new cv.Mat(); // Renamed to avoid conflict

        try {
            if (correctedMat.channels() === 4) { 
                cv.cvtColor(correctedMat, grayMat, cv.COLOR_RGBA2GRAY); 
            } else if (correctedMat.channels() === 3) { 
                cv.cvtColor(correctedMat, grayMat, cv.COLOR_RGB2GRAY); 
            } else {
                grayMat = correctedMat.clone(); 
            }
            
            channels.push_back(grayMat);
            let histSize = [256]; // Use array for histSize parameter
            let ranges = [0, 256]; // Use array for ranges parameter
            
            // Note: cv.calcHist expects histSize and ranges as arrays of numbers, not cv.Mat
            cv.calcHist(channels, [0], mask, hist, histSize, ranges, false);

            let totalPixels = grayMat.rows * grayMat.cols;
            let cumulativePixels = 0;
            const lowPercentile = totalPixels * 0.01; 
            const highPercentile = totalPixels * 0.99; 

            let effectiveMin = 0, effectiveMax = 255;

            for (let i = 0; i < 256; ++i) {
                cumulativePixels += hist.data32F[i];
                if (cumulativePixels > lowPercentile) {
                    effectiveMin = i;
                    break;
                }
            }

            cumulativePixels = 0;
            for (let i = 255; i >= 0; --i) {
                 cumulativePixels += hist.data32F[i];
                 if (cumulativePixels > (totalPixels - highPercentile)) { 
                     effectiveMax = i;
                     break;
                 }
            }

            let calculatedContrast = 1.0;
            if (effectiveMax > effectiveMin) {
                 calculatedContrast = 1.0 + (effectiveMax - effectiveMin - 128) / 128.0 * 0.5;
                 calculatedContrast = Math.max(0.5, Math.min(2.0, calculatedContrast));
            }

            let mean = 0;
            let sumOfIntensities = 0;
            for(let i = 0; i < 256; ++i) {
                sumOfIntensities += hist.data32F[i] * i;
            }
            if (totalPixels > 0) { // Avoid division by zero if image is empty
                 mean = sumOfIntensities / totalPixels;
            }


            let calculatedBrightness = (128 - mean) / 128.0 * 100.0;
            calculatedBrightness = Math.max(-100, Math.min(100, calculatedBrightness));

            console.log(`Calculated Brightness: ${calculatedBrightness.toFixed(2)}, Calculated Contrast: ${calculatedContrast.toFixed(2)}`);

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

            updateSliderValueDisplay(brightnessSlider, brightnessValue);
            updateSliderValueDisplay(contrastSlider, contrastValue);

            applyAllAdjustments(correctedMat, previewCanvas, true); 

            showUserMessage("明るさ・コントラストを自動調整しました。");

        } catch (err) {
            console.error("Error during auto adjustment:", err);
            showUserMessage("自動調整中にエラーが発生しました: " + err.message, true);
        } finally {
            if (grayMat && !grayMat.isDeleted()) grayMat.delete();
            if (hist && !hist.isDeleted()) hist.delete();
            if (mask && !mask.isDeleted()) mask.delete();
            if (channels && !channels.isDeleted()) channels.delete();
            if (histSizeMat && !histSizeMat.isDeleted()) histSizeMat.delete(); // Clean up if it was ever a Mat
            if (rangesMat && !rangesMat.isDeleted()) rangesMat.delete(); // Clean up if it was ever a Mat
            showLoader(false);
        }
    }, 100); 
}

if (autoAdjustButton) {
    autoAdjustButton.addEventListener('click', autoAdjustBrightnessContrast);
} else {
    console.error("Auto adjust button not found.");
}

if (resetBrightnessButton) {
    resetBrightnessButton.addEventListener('click', () => {
        console.log('resetBrightnessButton clicked'); 
        if (!correctedMat || correctedMat.empty() || !cvReady) { 
            showUserMessage("補正済み画像がないため、リセットできません。", true);
            return;
        }

        brightnessSlider.value = "0";
        contrastSlider.value = "1.0";

        updateSliderValueDisplay(brightnessSlider, brightnessValue);
        updateSliderValueDisplay(contrastSlider, contrastValue);

        applyAllAdjustments(correctedMat, previewCanvas, true); 

        showUserMessage("明るさ・コントラストをリセットしました。");
    });
} else {
    console.error("Reset brightness button not found.");
}

window.addEventListener('DOMContentLoaded', initApp);

[end of script.js]
