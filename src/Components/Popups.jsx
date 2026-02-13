import React, { useState } from 'react';

// Import images
import Flower from '../assets/Flower.png';
import SingleImage from '../assets/SpecialImage.png';

// Import 20 stack images nginang image6
import Image20 from '../assets/Image1.png';
import Image19 from '../assets/Image2.png';
import Image18 from '../assets/Image3.png';
import Image17 from '../assets/Image4.png';
import Image16 from '../assets/Image5.png';
import Image15 from '../assets/Image6.png';
import Image14 from '../assets/Image7.png';
import Image13 from '../assets/Image8.png';
import Image12 from '../assets/Image9.png';
import Image11 from '../assets/Image10.png';
import Image10 from '../assets/Image11.png';
import Image9 from '../assets/Image12.png';
import Image8 from '../assets/Image13.png';
import Image7 from '../assets/Image14.png';
import Image6 from '../assets/Image15.png';
import Image5 from '../assets/Image16.png';
import Image4 from '../assets/Image17.png';
import Image3 from '../assets/Image18.png';
import Image2 from '../assets/Image19.png';
import Image1 from '../assets/Image20.png';
import Image21 from '../assets/Image21.png';

const Popups = ({
  showFlowerPopup,
  showImageSetPopup,
  showSingleImagePopup,
  closeFlowerPopup,
  closeImageSetPopup,
  closeSingleImagePopup
}) => {
  
  const [stackOrder, setStackOrder] = useState(Array.from({length: 21}, (_, i) => i));
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingImage, setAnimatingImage] = useState(null);
  const [animationPhase, setAnimationPhase] = useState('idle');
  
  const stackImages = [
    Image1, Image2, Image3, Image4, Image5,
    Image6, Image7, Image8, Image9, Image10,
    Image11, Image12, Image13, Image14, Image15,
    Image16, Image17, Image18, Image19, Image20, Image21
  ];
  
  const handlePopupOutsideClick = (e, closeFunction) => {
    if (e.target.classList.contains('popup-overlay')) {
      closeFunction();
    }
  };

  const handleStackClick = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    const topImageIndex = stackOrder[19];
    setAnimatingImage(topImageIndex);
    
    setAnimationPhase('slide-out');
    
    setTimeout(() => {
      setAnimationPhase('slide-behind');
      
      setTimeout(() => {
        const newStack = [...stackOrder];
        const topImage = newStack.pop();
        newStack.unshift(topImage);
        setStackOrder(newStack);
        
        setAnimationPhase('slide-in');
        
        setTimeout(() => {
          setAnimationPhase('idle');
          setAnimatingImage(null);
          setIsAnimating(false);
        }, 400);
      }, 100);
    }, 400);
  };

  const getImagePosition = (imageIndex, positionInStack) => {
    const isTopImage = positionInStack === 19;
    const isSecondImage = positionInStack === 18;
    const isThirdImage = positionInStack === 17;
    const isBottomImage = positionInStack === 0;
    const isAnimatingThisImage = animatingImage === imageIndex;
    
    let animationClass = '';
    let zIndex = 10;
    
    if (isTopImage) {
      zIndex = 50;
      if (isAnimatingThisImage) {
        if (animationPhase === 'slide-out') {
          animationClass = 'animate-card-slide-out';
        } else if (animationPhase === 'slide-behind' || animationPhase === 'slide-in') {
          animationClass = 'animate-card-behind';
          zIndex = 5;
        }
      }
      
      return {
        zIndex,
        transform: 'translateX(0) translateY(0)',
        scale: 'scale(1)',
        rotate: 'rotate(0deg)',
        opacity: animationPhase === 'slide-behind' && isAnimatingThisImage ? 0.5 : 1,
        animation: animationClass,
        isTop: true
      };
    } else if (isSecondImage) {
      zIndex = 45;
      if (animationPhase === 'slide-out' || animationPhase === 'slide-behind') {
        animationClass = 'animate-second-to-top';
        zIndex = 48;
      }
      
      return {
        zIndex,
        transform: 'translateX(-6px) translateY(5px)',
        scale: 'scale(0.98)',
        rotate: 'rotate(1.5deg)',
        opacity: 1,
        animation: animationClass,
        isTop: false
      };
    } else if (isThirdImage) {
      zIndex = 40;
      if (animationPhase === 'slide-out' || animationPhase === 'slide-behind') {
        animationClass = 'animate-third-to-second';
        zIndex = 42;
      }
      
      return {
        zIndex,
        transform: 'translateX(-12px) translateY(10px)',
        scale: 'scale(0.96)',
        rotate: 'rotate(3deg)',
        opacity: 1,
        animation: animationClass,
        isTop: false
      };
    } else if (isBottomImage) {
      zIndex = 10;
      if (isAnimatingThisImage) {
        if (animationPhase === 'slide-in') {
          animationClass = 'animate-card-slide-in';
          zIndex = 15;
        } else if (animationPhase === 'slide-behind') {
          animationClass = 'animate-card-behind-prepare';
        }
      }
      
      return {
        zIndex,
        transform: 'translateX(15px) translateY(-6px)',
        scale: 'scale(0.92)',
        rotate: 'rotate(-4deg)',
        opacity: 1,
        animation: animationClass,
        isTop: false
      };
    } else {
      return {
        zIndex: 5,
        transform: 'translateX(20px) translateY(-8px)',
        scale: 'scale(0.85)',
        rotate: 'rotate(-6deg)',
        opacity: 0,
        animation: '',
        isTop: false
      };
    }
  };

  return (
    <>
      {/* Flower Popup */}
      {showFlowerPopup && (
        <div 
          className="popup-overlay fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={(e) => handlePopupOutsideClick(e, closeFlowerPopup)}
        >
          <div className="relative animate-popup-in">
            <img 
              src={Flower} 
              alt="Beautiful Flower" 
              className="max-w-[90vw] max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* 20 Image Stack Popup */}
      {showImageSetPopup && (
        <div 
          className="popup-overlay fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={(e) => handlePopupOutsideClick(e, closeImageSetPopup)}
        >
          <div className="relative animate-popup-in" onClick={(e) => e.stopPropagation()}>
            {/* Larger container for bigger images */}
            <div className="relative w-[400px] h-[400px] md:w-[500px] md:h-[500px] flex items-center justify-center">
              
              {stackOrder.map((imageIndex, positionInStack) => {
                const position = getImagePosition(imageIndex, positionInStack);
                
                const isVisible = positionInStack >= 17 || positionInStack === 0;
                if (!isVisible) return null;
                
                return (
                  <div 
                    key={`${imageIndex}-${positionInStack}`}
                    className={`absolute ${position.animation} ${position.isTop && !isAnimating ? 'cursor-pointer' : ''}`}
                    style={{ 
                      zIndex: position.zIndex
                    }}
                    onClick={position.isTop && !isAnimating ? handleStackClick : undefined}
                  >
                    <img 
                      src={stackImages[imageIndex]} 
                      alt={`Memory ${imageIndex + 1}`} 
                      // Much larger images - increased by 50%
                      className="w-auto h-auto max-w-[360px] max-h-[360px] md:max-w-[460px] md:max-h-[460px] object-contain"
                      style={{
                        transform: `${position.transform} ${position.scale} ${position.rotate}`,
                        opacity: position.opacity
                      }}
                    />
                  </div>
                );
              })}
              
            </div>
          </div>
        </div>
      )}

      {/* Single Image Popup */}
      {showSingleImagePopup && (
        <div 
          className="popup-overlay fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={(e) => handlePopupOutsideClick(e, closeSingleImagePopup)}
        >
          <div className="relative animate-popup-in">
            <img 
              src={SingleImage} 
              alt="Special Moment" 
              className="max-w-[90vw] max-h-[90vh] object-contain hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      )}

      {/* CSS Animations - Fixed: Removed jsx attribute */}
      <style>{`
        @keyframes cardSlideOut {
          0% {
            transform: translateX(0) translateY(0) scale(1) rotate(0deg);
            opacity: 1;
          }
          25% {
            transform: translateX(-80px) translateY(10px) scale(0.96) rotate(-12deg);
            opacity: 0.9;
          }
          50% {
            transform: translateX(-160px) translateY(20px) scale(0.92) rotate(-24deg);
            opacity: 0.7;
          }
          75% {
            transform: translateX(-240px) translateY(30px) scale(0.88) rotate(-36deg);
            opacity: 0.3;
          }
          100% {
            transform: translateX(-320px) translateY(40px) scale(0.84) rotate(-48deg);
            opacity: 0;
          }
        }
        
        @keyframes cardBehind {
          0% {
            transform: translateX(-320px) translateY(40px) scale(0.84) rotate(-48deg);
            opacity: 0;
          }
          33% {
            transform: translateX(-240px) translateY(25px) scale(0.78) rotate(-30deg);
            opacity: 0.1;
          }
          66% {
            transform: translateX(240px) translateY(-25px) scale(0.78) rotate(30deg);
            opacity: 0.1;
          }
          100% {
            transform: translateX(160px) translateY(-20px) scale(0.84) rotate(24deg);
            opacity: 0.2;
          }
        }
        
        @keyframes cardSlideIn {
          0% {
            transform: translateX(160px) translateY(-20px) scale(0.84) rotate(24deg);
            opacity: 0.2;
          }
          25% {
            transform: translateX(100px) translateY(-12px) scale(0.88) rotate(15deg);
            opacity: 0.4;
            z-index: 15;
          }
          50% {
            transform: translateX(50px) translateY(-6px) scale(0.91) rotate(6deg);
            opacity: 0.7;
            z-index: 15;
          }
          75% {
            transform: translateX(20px) translateY(-4px) scale(0.90) rotate(-2deg);
            opacity: 0.9;
            z-index: 15;
          }
          100% {
            transform: translateX(15px) translateY(-6px) scale(0.92) rotate(-4deg);
            opacity: 1;
            z-index: 10;
          }
        }
        
        @keyframes secondToTop {
          0% {
            transform: translateX(-6px) translateY(5px) scale(0.98) rotate(1.5deg);
          }
          50% {
            transform: translateX(-3px) translateY(2.5px) scale(0.99) rotate(0.75deg);
          }
          100% {
            transform: translateX(0) translateY(0) scale(1) rotate(0deg);
          }
        }
        
        @keyframes thirdToSecond {
          0% {
            transform: translateX(-12px) translateY(10px) scale(0.96) rotate(3deg);
          }
          50% {
            transform: translateX(-8px) translateY(6px) scale(0.97) rotate(2deg);
          }
          100% {
            transform: translateX(-6px) translateY(5px) scale(0.98) rotate(1.5deg);
          }
        }
        
        @keyframes cardBehindPrepare {
          0% {
            transform: translateX(15px) translateY(-6px) scale(0.92) rotate(-4deg);
          }
          100% {
            transform: translateX(12px) translateY(-5px) scale(0.94) rotate(-3deg);
          }
        }
        
        .animate-card-slide-out {
          animation: cardSlideOut 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-card-behind {
          animation: cardBehind 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-card-slide-in {
          animation: cardSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-second-to-top {
          animation: secondToTop 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-third-to-second {
          animation: thirdToSecond 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
        }
        
        .animate-card-behind-prepare {
          animation: cardBehindPrepare 0.1s ease-out forwards;
        }
        
        .absolute {
          transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        
        @keyframes popupIn {
          0% {
            opacity: 0;
            transform: scale(0.95);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-popup-in {
          animation: popupIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default Popups;