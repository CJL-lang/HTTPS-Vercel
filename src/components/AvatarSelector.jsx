/**
 * 头像选择组件
 * 功能：提供拍照、相册选择，以及圆形裁剪功能
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Image, X, Check, RotateCcw } from 'lucide-react';
import { useLanguage } from '../utils/LanguageContext';

const AvatarSelector = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState('select'); // 'select' | 'camera' | 'crop'
    const [selectedImage, setSelectedImage] = useState(null);
    const [stream, setStream] = useState(null);
    const [error, setError] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    
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
            // 重置变换状态
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
    const handleTakePhoto = async () => {
        try {
            setError(null);
            // 请求摄像头权限
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'environment', // 优先使用后置摄像头
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

    // 捕获照片
    const capturePhoto = () => {
        console.log('开始捕获照片...', { 
            videoRef: !!videoRef.current, 
            videoReady: videoRef.current?.readyState,
            videoWidth: videoRef.current?.videoWidth,
            videoHeight: videoRef.current?.videoHeight
        });

        if (!videoRef.current) {
            console.error('videoRef.current 不存在');
            setError('视频未准备好，请稍候再试');
            return;
        }

        const video = videoRef.current;
        
        // 检查视频是否已加载
        if (!video.videoWidth || !video.videoHeight) {
            console.error('视频尺寸无效', { width: video.videoWidth, height: video.videoHeight });
            setError('视频未准备好，请稍候再试');
            return;
        }

        try {
            // 创建临时canvas（不需要ref，直接创建）
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // 设置canvas尺寸与视频相同
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 绘制视频帧到canvas
            ctx.drawImage(video, 0, 0);

            // 转换为base64
            const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
            
            if (!imageDataUrl || imageDataUrl === 'data:,') {
                throw new Error('捕获的照片数据为空');
            }
            
            console.log('照片捕获成功');
            setSelectedImage(imageDataUrl);
            
            // 重置变换状态
            setScale(1);
            setPosition({ x: 0, y: 0 });
            
            // 停止摄像头
            stopCamera();
            setStep('crop');
        } catch (error) {
            console.error('捕获照片失败:', error);
            setError('捕获照片失败：' + (error.message || '未知错误'));
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
                setScale(prev => Math.max(0.5, Math.min(3, prev * scaleChange)));
            }
            setLastTouchDistance(distance);
        } else if (isDragging) {
            // 单指拖动
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            setPosition({
                x: clientX - dragStart.x,
                y: clientY - dragStart.y
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
        setScale(prev => Math.max(0.5, Math.min(3, prev * delta)));
    };

    // 圆形裁剪图片（根据当前变换参数）
    const cropImageToCircle = useCallback((imageSrc, currentScale, currentPosition) => {
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
                
                // 容器大小（像素）- 使用响应式容器的参考值
                // 实际容器是 max-w-md (28rem = 448px)，使用400px作为参考
                const containerSize = 400;
                // 圆形裁剪区域是容器的80% (w-4/5 h-4/5)
                const cropCircleSize = containerSize * 0.8; // 320px
                
                // 图片在容器中的显示尺寸（图片初始是100%容器大小，然后通过scale缩放）
                const displaySize = containerSize * currentScale;
                
                // 裁剪区域中心在容器中心
                const cropCenter = containerSize / 2;
                
                // 图片中心在容器中的位置（考虑位移）
                const imageCenterX = cropCenter + currentPosition.x;
                const imageCenterY = cropCenter + currentPosition.y;
                
                // 裁剪区域中心相对于图片中心的偏移（容器坐标）
                const offsetX = cropCenter - imageCenterX;
                const offsetY = cropCenter - imageCenterY;
                
                // 转换为图片原始坐标
                // 图片原始尺寸与显示尺寸的比例
                const imageToDisplayRatio = img.width / displaySize;
                
                // 裁剪区域在图片中的大小（使用圆形直径）
                const sourceCropSize = cropCircleSize * imageToDisplayRatio;
                
                // 裁剪区域中心在图片中的位置
                const sourceCropCenterX = (img.width / 2) + (offsetX * imageToDisplayRatio);
                const sourceCropCenterY = (img.height / 2) + (offsetY * imageToDisplayRatio);
                
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
            console.log('开始裁剪图片...', { scale, position });
            
            const cropped = await cropImageToCircle(selectedImage, scale, position);
            
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
                                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-black font-bold text-base uppercase tracking-widest shadow-[0_20px_40px_rgba(212,175,55,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Camera size={20} />
                                {t('takePhoto')}
                            </button>
                            <button
                                onClick={handleChooseFromAlbum}
                                className="w-full py-4 px-6 rounded-2xl surface-weak border border-white/10 text-white font-bold text-base uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Image size={20} />
                                {t('chooseFromAlbum')}
                            </button>
                            <button
                                onClick={handleClose}
                                className="w-full py-3 px-6 rounded-2xl surface-weak border border-white/10 text-white/60 font-bold text-sm active:scale-95 transition-all"
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
                        
                        {/* 隐藏的canvas用于拍照 */}
                        <canvas ref={canvasRef} className="hidden" />
                    </>
                )}

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

                        <div className="relative mb-4 rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: '1/1', maxHeight: '60vh' }}>
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover"
                                style={{ display: stream ? 'block' : 'none' }}
                            />
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
                            {/* 图片容器 - 显示完整图片，不被裁剪 */}
                            <div 
                                ref={cropContainerRef}
                                className="relative w-full max-w-md aspect-square rounded-2xl overflow-hidden bg-black/20"
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
                                {/* 可拖动的完整图片 */}
                                <img
                                    ref={cropImageRef}
                                    src={selectedImage}
                                    alt="Preview"
                                    className="absolute top-1/2 left-1/2 select-none"
                                    style={{
                                        width: `${100 * scale}%`,
                                        height: `${100 * scale}%`,
                                        objectFit: 'contain',
                                        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
                                        transition: isDragging ? 'none' : 'transform 0.1s ease-out',
                                        willChange: 'transform'
                                    }}
                                    draggable={false}
                                />
                                
                                {/* 圆形裁剪遮罩层 */}
                                <div className="absolute inset-0 pointer-events-none">
                                    {/* 使用SVG创建圆形遮罩 */}
                                    <svg className="w-full h-full">
                                        <defs>
                                            <mask id="cropCircleMask">
                                                <rect width="100%" height="100%" fill="white" />
                                                <circle cx="50%" cy="50%" r="40%" fill="black" />
                                            </mask>
                                        </defs>
                                        <rect width="100%" height="100%" fill="rgba(0,0,0,0.6)" mask="url(#cropCircleMask)" />
                                    </svg>
                                    {/* 圆形边框指示器 */}
                                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 rounded-full border-4 border-[#d4af37] shadow-lg"></div>
                                </div>
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
