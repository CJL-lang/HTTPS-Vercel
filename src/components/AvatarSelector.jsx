/**
 * 头像选择组件
 * 功能：提供拍照、相册选择，以及圆形裁剪功能
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Image, X, Check, RotateCcw, FlipHorizontal } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

const AvatarSelector = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState('select'); // 'select' | 'camera' | 'crop'
    const [selectedImage, setSelectedImage] = useState(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [facingMode, setFacingMode] = useState('environment'); // 'environment' (后置) | 'user' (前置)

    // 图片变换状态
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lastTouchDistance, setLastTouchDistance] = useState(null);

    const fileInputRef = useRef(null);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const imageRef = useRef(null);
    const cropContainerRef = useRef(null);
    const cropImageRef = useRef(null);

    // 清理摄像头流
    useEffect(() => {
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // 当stream和step都准备好时，将视频流绑定到video元素
    useEffect(() => {
        if (step === 'camera' && stream && videoRef.current) {
            videoRef.current.srcObject = stream;
            // 确保视频播放
            videoRef.current.play().catch(err => {
                console.error('视频播放失败:', err);
            });
        }
    }, [step, stream]);


    // 处理文件选择
    const handleFileSelect = (file) => {
        if (!file) return;

        // 验证文件类型
        if (!file.type.startsWith('image/')) {
            console.error('请选择图片文件');
            return;
        }

        // 验证文件大小（限制为5MB）
        if (file.size > 5 * 1024 * 1024) {
            console.error('图片大小不能超过5MB');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = (e) => {
            setSelectedImage(e.target.result);
            // 重置变换状态，稍后在图片加载完成后会调整
            setScale(1);
            setPosition({ x: 0, y: 0 });
            setStep('crop');
        };
        reader.readAsDataURL(file);
    };

    // 从相册选择
    const handleChooseFromAlbum = () => {
        fileInputRef.current?.click();
    };

    // 启动摄像头
    const handleTakePhoto = async (targetFacingMode = facingMode) => {
        try {
            setError(null);
            // 请求摄像头权限
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: targetFacingMode, // 'environment' (后置) | 'user' (前置)
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                }
            });

            // 先设置stream，useEffect会自动绑定到video元素
            setStream(mediaStream);
            setStep('camera');
        } catch (err) {
            console.error('无法访问摄像头:', err);
            let errorMessage = '无法访问摄像头';
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                errorMessage = '摄像头权限被拒绝，请在浏览器设置中允许摄像头访问';
            } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
                errorMessage = '未找到摄像头设备';
            } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
                errorMessage = '摄像头被其他应用占用';
            }
            setError(errorMessage);
        }
    };

    // 切换摄像头（前置/后置）
    const handleSwitchCamera = async () => {
        const newFacingMode = facingMode === 'environment' ? 'user' : 'environment';
        setFacingMode(newFacingMode);

        // 停止当前摄像头
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }

        // 启动新摄像头
        await handleTakePhoto(newFacingMode);
    };

    // 捕获照片
    const capturePhoto = () => {
        if (!videoRef.current) {
            console.error('视频元素不存在');
            setError('视频未准备好，请稍候再试');
            return;
        }

        const video = videoRef.current;

        // 检查视频是否已准备好
        if (!video.videoWidth || !video.videoHeight) {
            console.error('视频尺寸无效:', { width: video.videoWidth, height: video.videoHeight });
            setError('视频未准备好，请等待摄像头启动完成');
            return;
        }

        // 如果canvas不存在，创建一个临时的
        let canvas = canvasRef.current;
        if (!canvas) {
            canvas = document.createElement('canvas');
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            console.error('无法获取canvas上下文');
            setError('拍照失败，请重试');
            return;
        }

        try {
            // 设置canvas尺寸与视频相同
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 绘制视频帧到canvas
            ctx.drawImage(video, 0, 0);

            // 转换为base64
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);

            if (!imageDataUrl || imageDataUrl === 'data:,') {
                throw new Error('图片数据为空');
            }

            setSelectedImage(imageDataUrl);

            // 重置变换状态，稍后在图片加载完成后会应用边界限制
            setScale(1);
            setPosition({ x: 0, y: 0 });

            // 停止摄像头
            stopCamera();
            setStep('crop');
        } catch (error) {
            console.error('拍照失败:', error);
            setError('拍照失败，请重试');
        }
    };

    // 停止摄像头
    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    // 返回相机选择
    const handleBackToSelect = () => {
        stopCamera();
        setStep('select');
        setError(null);
    };

    // 计算两点之间的距离（用于双指缩放）
    const getDistance = (touch1, touch2) => {
        const dx = touch2.clientX - touch1.clientX;
        const dy = touch2.clientY - touch1.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    // 计算图片边界限制，确保圆形裁剪框不超出图片
    const calculateBounds = useCallback((currentScale, currentPosition) => {
        const container = cropContainerRef.current;
        const img = cropImageRef.current;

        if (!container || !img || !selectedImage || !img.naturalWidth || !img.naturalHeight) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, minScale: 0.5, maxScale: 3 };
        }

        const containerRect = container.getBoundingClientRect();
        const containerSize = Math.min(containerRect.width, containerRect.height);

        // 圆形裁剪框的半径（占容器的40%）
        const cropRadius = containerSize * 0.4;

        // 获取图片的原始尺寸和显示尺寸
        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;
        const imgAspect = imgNaturalWidth / imgNaturalHeight;

        // 由于使用object-fit: contain，计算图片在容器中的实际显示尺寸
        let imgDisplayWidth, imgDisplayHeight;
        if (imgAspect > 1) {
            // 图片更宽，以宽度为准
            imgDisplayWidth = containerSize;
            imgDisplayHeight = containerSize / imgAspect;
        } else {
            // 图片更高，以高度为准
            imgDisplayHeight = containerSize;
            imgDisplayWidth = containerSize * imgAspect;
        }

        // 图片在容器中的实际显示区域（考虑缩放）
        const scaledImgWidth = imgDisplayWidth * currentScale;
        const scaledImgHeight = imgDisplayHeight * currentScale;

        // 图片中心相对于容器中心的位置（考虑位移）
        const imgCenterX = containerSize / 2 + currentPosition.x;
        const imgCenterY = containerSize / 2 + currentPosition.y;

        // 图片的边界（相对于容器中心）
        const imgLeft = imgCenterX - scaledImgWidth / 2;
        const imgRight = imgCenterX + scaledImgWidth / 2;
        const imgTop = imgCenterY - scaledImgHeight / 2;
        const imgBottom = imgCenterY + scaledImgHeight / 2;

        // 圆形裁剪框的中心必须在图片范围内
        // 圆形框中心的最小和最大位置（相对于容器中心）
        const minX = imgLeft + cropRadius - containerSize / 2;
        const maxX = imgRight - cropRadius - containerSize / 2;
        const minY = imgTop + cropRadius - containerSize / 2;
        const maxY = imgBottom - cropRadius - containerSize / 2;

        // 计算最小缩放比例，确保圆形框可以完全包含在图片内
        // 需要满足：2 * cropRadius <= min(scaledImgWidth, scaledImgHeight)
        const minScaleForFit = (2 * cropRadius) / Math.min(imgDisplayWidth, imgDisplayHeight);

        return {
            minX: Math.min(minX, 0),
            maxX: Math.max(maxX, 0),
            minY: Math.min(minY, 0),
            maxY: Math.max(maxY, 0),
            minScale: Math.max(minScaleForFit, 0.5),
            maxScale: 3
        };
    }, [selectedImage]);

    // 处理鼠标/触摸开始
    const handleStart = (e) => {
        if (e.touches && e.touches.length === 2) {
            // 双指缩放
            const distance = getDistance(e.touches[0], e.touches[1]);
            setLastTouchDistance(distance);
        } else {
            // 单指拖动
            setIsDragging(true);
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setDragStart({ x: clientX - position.x, y: clientY - position.y });
        }
    };

    // 处理拖动
    const handleMove = (e) => {
        if (e.touches && e.touches.length === 2) {
            // 双指缩放
            const distance = getDistance(e.touches[0], e.touches[1]);
            if (lastTouchDistance !== null) {
                const scaleChange = distance / lastTouchDistance;
                setScale(prev => {
                    const newScale = Math.max(0.5, Math.min(3, prev * scaleChange));
                    // 应用缩放后，检查并限制位置
                    const bounds = calculateBounds(newScale, position);
                    const clampedScale = Math.max(bounds.minScale, Math.min(bounds.maxScale, newScale));
                    // 如果缩放被限制，重新计算位置
                    if (clampedScale !== newScale) {
                        const finalBounds = calculateBounds(clampedScale, position);
                        setPosition({
                            x: Math.max(finalBounds.minX, Math.min(finalBounds.maxX, position.x)),
                            y: Math.max(finalBounds.minY, Math.min(finalBounds.maxY, position.y))
                        });
                    }
                    return clampedScale;
                });
            }
            setLastTouchDistance(distance);
        } else if (isDragging) {
            // 单指拖动
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            const newPosition = {
                x: clientX - dragStart.x,
                y: clientY - dragStart.y
            };

            // 应用边界限制
            const bounds = calculateBounds(scale, newPosition);
            setPosition({
                x: Math.max(bounds.minX, Math.min(bounds.maxX, newPosition.x)),
                y: Math.max(bounds.minY, Math.min(bounds.maxY, newPosition.y))
            });
        }
    };

    // 处理结束
    const handleEnd = () => {
        setIsDragging(false);
        setLastTouchDistance(null);
    };

    // 处理滚轮缩放
    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? 0.9 : 1.1;
        setScale(prev => {
            const newScale = prev * delta;
            const bounds = calculateBounds(newScale, position);
            const clampedScale = Math.max(bounds.minScale, Math.min(bounds.maxScale, newScale));

            // 如果缩放被限制，调整位置以确保圆形框在图片内
            if (clampedScale !== newScale || clampedScale === bounds.minScale) {
                const finalBounds = calculateBounds(clampedScale, position);
                setPosition({
                    x: Math.max(finalBounds.minX, Math.min(finalBounds.maxX, position.x)),
                    y: Math.max(finalBounds.minY, Math.min(finalBounds.maxY, position.y))
                });
            }

            return clampedScale;
        });
    };

    // 圆形裁剪图片（根据当前变换参数）
    const cropImageToCircle = useCallback((imageSrc, currentScale, currentPosition, containerWidth, containerHeight) => {
        return new Promise((resolve, reject) => {
            if (!imageSrc) {
                reject(new Error('图片源为空'));
                return;
            }

            const img = new window.Image();
            img.onerror = (error) => {
                console.error('图片加载失败:', error);
                reject(new Error('图片加载失败'));
            };

            img.onload = () => {
                try {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // 裁剪区域大小（圆形直径）- 使用高质量尺寸
                    const cropSize = 512;
                    canvas.width = cropSize;
                    canvas.height = cropSize;

                    // 创建圆形裁剪路径
                    ctx.beginPath();
                    ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2, 0, Math.PI * 2);
                    ctx.clip();

                    // 使用实际容器尺寸（取较小值，因为容器是正方形）
                    const containerSize = Math.min(containerWidth || 320, containerHeight || 320);

                    // 圆形裁剪区域的半径（占容器的40%，与UI中的遮罩一致）
                    const cropRadius = containerSize * 0.4;

                    // 获取图片在容器中的实际显示尺寸
                    // 图片使用objectFit: contain，所以需要计算实际显示尺寸
                    const imageAspect = img.width / img.height;
                    const containerAspect = 1; // 容器是正方形

                    let displayWidth, displayHeight;
                    if (imageAspect > containerAspect) {
                        // 图片更宽，以宽度为准
                        displayWidth = containerSize;
                        displayHeight = containerSize / imageAspect;
                    } else {
                        // 图片更高，以高度为准
                        displayHeight = containerSize;
                        displayWidth = containerSize * imageAspect;
                    }

                    // 应用缩放
                    const scaledDisplayWidth = displayWidth * currentScale;
                    const scaledDisplayHeight = displayHeight * currentScale;

                    // 图片中心在容器中的位置（考虑位移）
                    const containerCenter = containerSize / 2;
                    const imageCenterX = containerCenter + currentPosition.x;
                    const imageCenterY = containerCenter + currentPosition.y;

                    // 裁剪区域中心相对于图片中心的偏移（容器坐标）
                    const offsetX = containerCenter - imageCenterX;
                    const offsetY = containerCenter - imageCenterY;

                    // 转换为图片原始坐标
                    // 图片原始尺寸与显示尺寸的比例
                    const imageToDisplayRatioX = img.width / scaledDisplayWidth;
                    const imageToDisplayRatioY = img.height / scaledDisplayHeight;

                    // 裁剪区域在图片中的大小（使用半径的2倍作为直径）
                    const sourceCropSize = cropRadius * 2 * Math.max(imageToDisplayRatioX, imageToDisplayRatioY);

                    // 裁剪区域中心在图片中的位置
                    const sourceCropCenterX = (img.width / 2) + (offsetX * imageToDisplayRatioX);
                    const sourceCropCenterY = (img.height / 2) + (offsetY * imageToDisplayRatioY);

                    // 裁剪区域的左上角坐标
                    const sourceX = sourceCropCenterX - sourceCropSize / 2;
                    const sourceY = sourceCropCenterY - sourceCropSize / 2;

                    // 确保不超出图片边界
                    const clampedSourceX = Math.max(0, Math.min(sourceX, img.width - sourceCropSize));
                    const clampedSourceY = Math.max(0, Math.min(sourceY, img.height - sourceCropSize));
                    const clampedSourceSize = Math.min(
                        sourceCropSize,
                        img.width - clampedSourceX,
                        img.height - clampedSourceY
                    );

                    // 绘制图片
                    ctx.drawImage(
                        img,
                        clampedSourceX, clampedSourceY, clampedSourceSize, clampedSourceSize,
                        0, 0, cropSize, cropSize
                    );

                    // 转换为base64，使用高质量JPEG格式
                    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);

                    if (!croppedDataUrl || croppedDataUrl === 'data:,') {
                        reject(new Error('裁剪后的图片数据为空'));
                        return;
                    }

                    resolve(croppedDataUrl);
                } catch (error) {
                    console.error('裁剪过程中出错:', error);
                    reject(error);
                }
            };
            img.src = imageSrc;
        });
    }, []);

    // 处理裁剪确认
    const handleCropConfirm = async () => {
        if (!selectedImage) {
            console.error('没有选中的图片');
            return;
        }

        if (isProcessing) {
            return; // 防止重复点击
        }

        try {
            setIsProcessing(true);

            // 获取容器的实际尺寸
            const container = cropContainerRef.current;
            if (!container) {
                throw new Error('无法获取容器尺寸');
            }

            const containerRect = container.getBoundingClientRect();
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            console.log('开始裁剪图片...', { scale, position, containerWidth, containerHeight });

            const cropped = await cropImageToCircle(selectedImage, scale, position, containerWidth, containerHeight);

            if (!cropped) {
                throw new Error('裁剪失败');
            }

            console.log('裁剪完成，调用onConfirm');
            onConfirm(cropped);
            handleClose();
        } catch (error) {
            console.error('裁剪图片失败:', error);
            setError('裁剪图片失败，请重试');
            setIsProcessing(false);
        }
    };

    // 关闭模态框
    const handleClose = () => {
        stopCamera();
        setStep('select');
        setSelectedImage(null);
        setError(null);
        setIsProcessing(false);
        onClose();
    };

    // 重新选择
    const handleReselect = () => {
        stopCamera();
        setStep('select');
        setSelectedImage(null);
        setError(null);
        setScale(1);
        setPosition({ x: 0, y: 0 });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={handleClose}
        >
            <div
                className="surface-strong border-2 border-[#d4af37]/30 rounded-3xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
            >
                {step === 'select' && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold text-white">
                                {t('changeAvatar')}
                            </h3>
                            <button
                                onClick={handleClose}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-white/60" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleTakePhoto}
                                className="w-full py-4 px-6 rounded-2xl surface-weak border border-white/10 text-white font-bold text-base uppercase tracking-widest hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Camera size={20} />
                                {t('takePhoto')}
                            </button>
                            <button
                                onClick={handleChooseFromAlbum}
                                className="w-full py-4 px-6 rounded-2xl surface-weak border border-white/10 text-white font-bold text-base uppercase tracking-widest hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Image size={20} />
                                {t('chooseFromAlbum')}
                            </button>
                            <button
                                onClick={handleClose}
                                className="w-full py-4 px-6 rounded-2xl surface-weak border border-white/10 text-white font-bold text-base uppercase tracking-widest hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                {t('cancel')}
                            </button>
                        </div>

                        {/* 隐藏的文件输入 */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleFileSelect(e.target.files?.[0])}
                            className="hidden"
                        />
                    </>
                )}

                {/* 隐藏的canvas用于拍照 - 在所有步骤中都存在 */}
                <canvas ref={canvasRef} className="hidden" />

                {step === 'camera' && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {t('takePhoto')}
                            </h3>
                            <button
                                onClick={handleBackToSelect}
                                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                            >
                                <X size={20} className="text-white/60" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="relative mb-4 rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '4/3', maxHeight: '60vh' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-contain"
                                style={{ display: stream ? 'block' : 'none' }}
                            />
                            {/* 切换摄像头按钮 - 放在右上角 */}
                            {stream && (
                                <button
                                    onClick={handleSwitchCamera}
                                    className="absolute top-3 right-3 p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all active:scale-95 z-10"
                                    title={facingMode === 'environment' ? '切换到前置摄像头' : '切换到后置摄像头'}
                                >
                                    <FlipHorizontal size={20} className="text-white" />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleBackToSelect}
                                className="flex-1 py-3 px-6 rounded-2xl surface-weak border border-white/10 text-white/60 font-bold text-sm active:scale-95 transition-all hover:border-white/20 flex items-center justify-center gap-2"
                            >
                                <RotateCcw size={18} />
                                {t('cancel')}
                            </button>
                            <button
                                onClick={capturePhoto}
                                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Camera size={18} />
                                {t('confirm')}
                            </button>
                        </div>
                    </>
                )}

                {step === 'crop' && selectedImage && (
                    <>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">
                                {t('cropAvatar')}
                            </h3>
                            <button
                                onClick={handleReselect}
                                className="text-[#d4af37] text-sm font-bold hover:text-[#d4af37]/80 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl">
                                <p className="text-red-400 text-sm">{error}</p>
                            </div>
                        )}

                        <div className="relative mb-6 flex items-center justify-center" style={{ minHeight: '320px' }}>
                            {/* 外层容器 - 用于显示完整图片 */}
                            <div
                                ref={cropContainerRef}
                                className="relative w-full max-w-md aspect-square overflow-hidden bg-black/20 rounded-2xl"
                                onMouseDown={handleStart}
                                onMouseMove={handleMove}
                                onMouseUp={handleEnd}
                                onMouseLeave={handleEnd}
                                onTouchStart={handleStart}
                                onTouchMove={handleMove}
                                onTouchEnd={handleEnd}
                                onWheel={handleWheel}
                                style={{ touchAction: 'none', cursor: isDragging ? 'grabbing' : 'grab' }}
                            >
                                {/* 可拖动的图片 - 完整显示 */}
                                <img
                                    ref={cropImageRef}
                                    src={selectedImage}
                                    alt="Preview"
                                    className="absolute top-1/2 left-1/2 select-none"
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        objectFit: 'contain',
                                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                        willChange: 'transform'
                                    }}
                                    draggable={false}
                                    onLoad={(e) => {
                                        // 图片加载完成后，应用边界限制确保圆形框在图片内
                                        const img = e.target;
                                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                                            setTimeout(() => {
                                                const bounds = calculateBounds(scale, position);
                                                // 检查并调整位置和缩放
                                                let newPosition = { ...position };
                                                let newScale = scale;

                                                // 如果位置超出边界，调整位置
                                                if (position.x < bounds.minX || position.x > bounds.maxX ||
                                                    position.y < bounds.minY || position.y > bounds.maxY) {
                                                    newPosition = {
                                                        x: Math.max(bounds.minX, Math.min(bounds.maxX, position.x)),
                                                        y: Math.max(bounds.minY, Math.min(bounds.maxY, position.y))
                                                    };
                                                }

                                                // 如果缩放太小，调整到最小缩放
                                                if (scale < bounds.minScale) {
                                                    newScale = bounds.minScale;
                                                    // 重新计算边界
                                                    const newBounds = calculateBounds(newScale, newPosition);
                                                    newPosition = {
                                                        x: Math.max(newBounds.minX, Math.min(newBounds.maxX, newPosition.x)),
                                                        y: Math.max(newBounds.minY, Math.min(newBounds.maxY, newPosition.y))
                                                    };
                                                }

                                                // 如果有变化，更新状态
                                                if (newPosition.x !== position.x || newPosition.y !== position.y) {
                                                    setPosition(newPosition);
                                                }
                                                if (newScale !== scale) {
                                                    setScale(newScale);
                                                }
                                            }, 50);
                                        }
                                    }}
                                />

                                {/* 圆形裁剪遮罩层 - 使用SVG遮罩 */}
                                <div className="absolute inset-0 pointer-events-none">
                                    <svg className="w-full h-full">
                                        <defs>
                                            <mask id="cropCircleMask">
                                                <rect width="100%" height="100%" fill="black" />
                                                <circle cx="50%" cy="50%" r="40%" fill="white" />
                                            </mask>
                                        </defs>
                                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#cropCircleMask)" />
                                    </svg>
                                </div>

                                {/* 圆形裁剪边框指示器 */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-full border-4 border-[#d4af37] shadow-lg pointer-events-none"></div>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={handleReselect}
                                className="flex-1 py-3 px-6 rounded-2xl surface-weak border border-white/10 text-white/60 font-bold text-sm active:scale-95 transition-all hover:border-white/20"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleCropConfirm}
                                disabled={isProcessing}
                                className="flex-1 py-3 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-sm uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isProcessing ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                        <span>处理中...</span>
                                    </>
                                ) : (
                                    <>
                                        <Check size={18} />
                                        {t('confirm')}
                                    </>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AvatarSelector;
