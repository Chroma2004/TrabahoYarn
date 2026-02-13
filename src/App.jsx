import { useState, useEffect } from 'react';
import Envelope from './assets/Envelope.png';
import EnvelopeOpen from './assets/EnvelopeOpen.png';
import Sticker from './assets/Vinicius.png';
import Letter from './assets/Letter.png';
import Button1 from './assets/B1.png';
import Button2 from './assets/B2.png';
import Button3 from './assets/B3.png';
import Footer from './assets/Footer.png';
import GStar from './assets/GStar.png';
import BStar from './assets/BStar.png';
import YStar from './assets/YStar.png';
import Popups from './Components/Popups.jsx';
import Title from './assets/Title.png';

function App() {
  const [isPulled, setIsPulled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showLetter, setShowLetter] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isPeeling, setIsPeeling] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [isLetterRevealing, setIsLetterRevealing] = useState(false);
  const [isShaking, setIsShaking] = useState(true);
  const [stars, setStars] = useState([]);
  
  // New states for popups
  const [showFlowerPopup, setShowFlowerPopup] = useState(false);
  const [showImageSetPopup, setShowImageSetPopup] = useState(false);
  const [showSingleImagePopup, setShowSingleImagePopup] = useState(false);

  useEffect(() => {
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.style.overflow = 'hidden';
    
    const shakeTimer = setTimeout(() => {
      setIsShaking(false);
    }, 1200);
    
    // Generate initial stars
    const initialStars = Array.from({ length: 15 }, () => createStar());
    setStars(initialStars);
    
    // Create new stars periodically
    const starInterval = setInterval(() => {
      setStars(prev => {
        if (prev.length < 25) {
          return [...prev, createStar()];
        }
        return prev;
      });
    }, 2000);
    
    // Clean up old stars
    const cleanupInterval = setInterval(() => {
      setStars(prev => prev.filter(star => Date.now() - star.createdAt < 10000));
    }, 1000);
    
    return () => {
      clearTimeout(shakeTimer);
      clearInterval(starInterval);
      clearInterval(cleanupInterval);
    };
  }, []);

  const createStar = () => {
    const starTypes = [GStar, BStar, YStar];
    const starType = starTypes[Math.floor(Math.random() * starTypes.length)];
    const size = Math.random() * 20 + 15; // 15-35px
    const left = Math.random() * 100; // 0-100%
    const duration = Math.random() * 3 + 4; // 4-7 seconds
    const delay = Math.random() * 2; // 0-2 seconds delay
    const opacity = Math.random() * 0.7 + 0.3; // 0.3-1 opacity
    const driftLeft = Math.random() * 50 + 20; // 20-70px leftward drift
    const rotateSpeed = Math.random() * 2 + 1; // 1-3 seconds for full rotation
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      type: starType,
      size,
      left,
      duration,
      delay,
      opacity,
      driftLeft,
      rotateSpeed,
      createdAt: Date.now()
    };
  };

  const handleStickerClick = () => {
    if (!isPulled) {
      setIsShaking(false);
      setIsPeeling(true);
      setTimeout(() => {
        setIsPulled(true);
        setIsPeeling(false);
      }, 400);
    }
  };

  const handleEnvelopeClick = () => {
    if (isPulled && !isOpen && !isAnimating) {
      setIsOpening(true);
      setIsAnimating(true);
      
      setTimeout(() => {
        setIsOpen(true);
        setIsOpening(false);
        
        setTimeout(() => {
          setIsLetterRevealing(true);
          
          setTimeout(() => {
            setShowLetter(true);
            setIsAnimating(false);
            setIsLetterRevealing(false);
          }, 800);
        }, 300);
      }, 800);
    }
  };

  const handleReset = () => {
    setIsPulled(false);
    setIsOpen(false);
    setShowLetter(false);
    setIsAnimating(false);
    setIsPeeling(false);
    setIsOpening(false);
    setIsLetterRevealing(false);
    setIsShaking(true);
    
    setTimeout(() => {
      setIsShaking(false);
    }, 1200);
  };

  // Updated button handlers to show popups
  const handleButton1Click = () => {
    setShowFlowerPopup(true);
  };

  const handleButton2Click = () => {
    setShowImageSetPopup(true);
  };

  const handleButton3Click = () => {
    setShowSingleImagePopup(true);
  };

  return (
    <div className="bg-black h-screen w-screen flex flex-col items-center justify-between relative overflow-hidden">
      
      {/* Falling Stars Background */}
      <div className="absolute inset-0 pointer-events-none z-1 overflow-hidden">
        {stars.map((star) => (
          <div
            key={star.id}
            className="absolute"
            style={{
              left: `${star.left}%`,
              top: '-50px',
              width: `${star.size}px`,
              height: `${star.size}px`,
              animationDuration: `${star.duration}s`,
              animationDelay: `${star.delay}s`,
              opacity: star.opacity,
              zIndex: 1
            }}
          >
            {/* Trail effect - placed behind the star */}
            <div 
              className="absolute inset-0 animate-star-trail"
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
            
            {/* Main star with falling animation and rotation */}
            <div 
              className="absolute animate-falling-star-down"
              style={{
                animationDuration: `${star.duration}s`,
                animationDelay: `${star.delay}s`,
                left: 0,
                top: 0,
                width: '100%',
                height: '100%',
                '--drift-left': `${star.driftLeft}px`,
              }}
            >
              <img
                src={star.type}
                alt="Star"
                className="w-full h-full animate-star-rotate"
                style={{
                  filter: `brightness(${star.opacity}) drop-shadow(0 0 10px currentColor)`,
                  animationDuration: `${star.rotateSpeed}s`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Title background layer - Made bigger and positioned at top */}
      <div className="absolute top-8 left-0 right-0 w-full flex justify-center pointer-events-none z-0">
        <img 
          src={Title} 
          alt="Title" 
          className="w-full min-w-[350px] max-w-[400px] md:max-w-[400px] lg:max-w-[500px] xl:max-w-[600px]"
        />
      </div>

      {/* Footer background layer - Made bigger */}
      <div className="absolute bottom-0 left-0 right-0 w-full flex justify-center pointer-events-none z-0">
        <img 
          src={Footer} 
          alt="Footer" 
          className="w-full min-w-[350px] max-w-[600px] md:max-w-[700px] lg:max-w-[800px] xl:max-w-[900px]"
        />
      </div>

      {/* Main content area - Centered */}
      <div className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        {/* Letter - Highest layer when shown */}
        {showLetter && (
          <div className="relative z-50">
            <img 
              src={Letter} 
              alt="Letter" 
              className="w-full max-w-[1000px] md:max-w-[600px] lg:max-w-[600px] xl:max-w-[600px] 2xl:max-w-[750px] animate-letter-final"
            />
          </div>
        )}

        {/* Envelope area */}
        {!showLetter && (
          <div className="relative z-20">
            {!isOpen && !isOpening && (
              <img 
                src={Envelope} 
                alt="Envelope" 
                className={`w-full max-w-[1000px] md:max-w-[500px] lg:max-w-[500px] xl:max-w-[550px] 2xl:max-w-[600px] transition-all duration-500 ${(isPulled && !isOpen) ? 'cursor-pointer hover:scale-[1.01]' : 'cursor-default'}`}
                onClick={handleEnvelopeClick}
              />
            )}
            
            {isOpening && (
              <div className="relative animate-envelope-open">
                <img 
                  src={Envelope} 
                  alt="Opening Envelope" 
                  className="w-full max-w-[1000px] md:max-w-[500px] lg:max-w-[500px] xl:max-w-[550px] 2xl:max-w-[600px] animate-envelope-open-scale"
                />
                <img 
                  src={EnvelopeOpen} 
                  alt="Opened Envelope" 
                  className="absolute top-0 left-0 w-full max-w-[1000px] md:max-w-[500px] lg:max-w-[500px] xl:max-w-[550px] 2xl:max-w-[600px] animate-envelope-open-reveal"
                />
              </div>
            )}
            
            {isOpen && !showLetter && !isLetterRevealing && (
              <img 
                src={EnvelopeOpen} 
                alt="Opened Envelope" 
                className="w-full max-w-[1000px] md:max-w-[500px] lg:max-w-[500px] xl:max-w-[550px] 2xl:max-w-[600px] cursor-pointer hover:opacity-95 transition-opacity"
                onClick={handleEnvelopeClick}
              />
            )}
            
            {isLetterRevealing && (
              <div className="relative z-40">
                <img 
                  src={EnvelopeOpen} 
                  alt="Envelope Background" 
                  className="w-full max-w-[1000px] md:max-w-[500px] lg:max-w-[500px] xl:max-w-[550px] 2xl:max-w-[600px] opacity-80 blur-[1px]"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    <img 
                      src={Letter} 
                      alt="Emerging Letter" 
                      className="w-full max-w-[800px] md:max-w-[500px] lg:max-w-[500px] xl:max-w-[500px] 2xl:max-w-[480px] animate-letter-emerge shadow-2xl"
                      style={{ transformOrigin: 'center 100%' }}
                    />
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-yellow-200/0 via-yellow-200/10 to-yellow-200/0 animate-letter-glow pointer-events-none"></div>
                  </div>
                </div>
              </div>
            )}
            
            {!isPulled && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`relative ${isPeeling ? 'animate-peel-container' : ''}`}>
                  <img 
                    src={Sticker} 
                    alt="Vinicius Sticker" 
                    className={`w-full max-w-[700px] md:max-w-[400px] lg:max-w-[400px] xl:max-w-[400px] 2xl:max-w-[420px] cursor-pointer transition-all duration-200 hover:scale-105 ${isPeeling ? 'opacity-0' : 'opacity-100'} ${isShaking ? 'animate-sticker-wobble' : ''}`}
                    onClick={handleStickerClick}
                  />
                  
                  {isPeeling && (
                    <>
                      <div className="absolute inset-0 animate-peel-sticker">
                        <div className="relative w-full h-full">
                          <img 
                            src={Sticker} 
                            alt="Peeling Sticker" 
                            className="w-full max-w-[700px] md:max-w-[630px] lg:max-w-[560px] xl:max-w-[490px] 2xl:max-w-[420px]"
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20"></div>
                        </div>
                      </div>
                      <div className="absolute inset-0 animate-peel-shadow z-[-1]"></div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Buttons container - Fixed above footer with proper z-index */}
      <div className="relative z-40 w-full flex flex-col items-center pb-6 md:pb-8 lg:pb-10">
        {showLetter && (
          <div className="mb-4 md:mb-6 lg:mb-8">
            <button 
              onClick={handleReset}
              className="bg-white text-black px-4 py-2 md:px-6 md:py-2.5 lg:px-8 lg:py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors shadow-lg text-sm md:text-base lg:text-lg"
            >
              Back
            </button>
          </div>
        )}
        
        {/* Action buttons - Always visible */}
        <div className="flex justify-center gap-4 md:gap-6 lg:gap-8">
          <button onClick={handleButton1Click} className="transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none">
            <img src={Button1} alt="Button 1" className="w-20 md:w-28 lg:w-32 xl:w-36" />
          </button>
          <button onClick={handleButton2Click} className="transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none">
            <img src={Button2} alt="Button 2" className="w-20 md:w-28 lg:w-32 xl:w-36" />
          </button>
          <button onClick={handleButton3Click} className="transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none">
            <img src={Button3} alt="Button 3" className="w-20 md:w-28 lg:w-32 xl:w-36" />
          </button>
        </div>
      </div>

      {/* Import Popups Component */}
      <Popups
        showFlowerPopup={showFlowerPopup}
        showImageSetPopup={showImageSetPopup}
        showSingleImagePopup={showSingleImagePopup}
        closeFlowerPopup={() => setShowFlowerPopup(false)}
        closeImageSetPopup={() => setShowImageSetPopup(false)}
        closeSingleImagePopup={() => setShowSingleImagePopup(false)}
      />

      {/* Regular style tag instead of jsx global */}
      <style>{`
        @keyframes stickerWobble {
          0% { transform: translateX(0) rotate(0deg); }
          15% { transform: translateX(-3px) rotate(-0.3deg); }
          30% { transform: translateX(4px) rotate(0.4deg); }
          45% { transform: translateX(-2px) rotate(-0.2deg); }
          60% { transform: translateX(3px) rotate(0.3deg); }
          75% { transform: translateX(-1px) rotate(-0.1deg); }
          90% { transform: translateX(2px) rotate(0.2deg); }
          100% { transform: translateX(0) rotate(0deg); }
        }
        
        @keyframes peelSticker {
          0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); transform-origin: top left; filter: brightness(1) drop-shadow(0 1px 2px rgba(0,0,0,0.2)); opacity: 1; }
          10% { transform: rotateX(2deg) rotateY(-5deg) rotateZ(1deg); transform-origin: top left; filter: brightness(1.05) drop-shadow(0 2px 3px rgba(0,0,0,0.2)); opacity: 1; }
          20% { transform: rotateX(5deg) rotateY(-12deg) rotateZ(3deg); transform-origin: top left; filter: brightness(1.1) drop-shadow(-1px 3px 4px rgba(0,0,0,0.25)); opacity: 0.98; }
          30% { transform: rotateX(10deg) rotateY(-20deg) rotateZ(6deg); transform-origin: top left; filter: brightness(1.15) drop-shadow(-2px 4px 6px rgba(0,0,0,0.3)); opacity: 0.96; }
          40% { transform: rotateX(18deg) rotateY(-30deg) rotateZ(9deg) translateX(5px); transform-origin: top left; filter: brightness(1.2) drop-shadow(-2px 5px 7px rgba(0,0,0,0.35)); opacity: 0.94; }
          50% { transform: rotateX(25deg) rotateY(-40deg) rotateZ(12deg) translateX(10px) translateY(-8px); transform-origin: top left; filter: brightness(1.25) drop-shadow(-3px 6px 9px rgba(0,0,0,0.4)); opacity: 0.9; }
          60% { transform: rotateX(32deg) rotateY(-50deg) rotateZ(15deg) translateX(18px) translateY(-15px); transform-origin: top left; filter: brightness(1.3) drop-shadow(-4px 8px 12px rgba(0,0,0,0.45)); opacity: 0.85; }
          70% { transform: rotateX(40deg) rotateY(-58deg) rotateZ(18deg) translateX(28px) translateY(-22px); transform-origin: top left; filter: brightness(1.35) drop-shadow(-5px 10px 14px rgba(0,0,0,0.5)); opacity: 0.75; }
          80% { transform: rotateX(48deg) rotateY(-65deg) rotateZ(21deg) translateX(40px) translateY(-30px); transform-origin: top left; filter: brightness(1.4) drop-shadow(-6px 12px 17px rgba(0,0,0,0.6)); opacity: 0.6; }
          90% { transform: rotateX(55deg) rotateY(-72deg) rotateZ(23deg) translateX(55px) translateY(-38px) scale(0.95); transform-origin: top left; filter: brightness(1.45) drop-shadow(-7px 14px 20px rgba(0,0,0,0.65)); opacity: 0.4; }
          100% { transform: rotateX(60deg) rotateY(-75deg) rotateZ(25deg) translateX(70px) translateY(-45px) scale(0.9); transform-origin: top left; filter: brightness(1.5) drop-shadow(-8px 16px 22px rgba(0,0,0,0.7)); opacity: 0; }
        }
        
        @keyframes peelShadow {
          0% { background: radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.08) 0%, transparent 70%); opacity: 0; }
          25% { background: radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.15) 0%, transparent 70%); opacity: 0.4; }
          50% { background: radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.22) 0%, transparent 70%); opacity: 0.7; }
          75% { background: radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.15) 0%, transparent 70%); opacity: 0.4; }
          100% { background: radial-gradient(ellipse at 0% 0%, rgba(0,0,0,0.05) 0%, transparent 70%); opacity: 0; }
        }
        
        @keyframes envelopeOpenScale {
          0% { transform: scale(1); opacity: 1; }
          20% { transform: scale(1.03) translateY(-5px); opacity: 1; }
          40% { transform: scale(1); opacity: 0.8; }
          60% { transform: scale(0.97); opacity: 0.5; }
          100% { transform: scale(0.95); opacity: 0; }
        }
        
        @keyframes envelopeOpenReveal {
          0% { opacity: 0; transform: scale(0.9) translateY(10px); filter: blur(5px); }
          40% { opacity: 0; transform: scale(0.92) translateY(8px); filter: blur(4px); }
          60% { opacity: 0.5; transform: scale(0.95) translateY(5px); filter: blur(2px); }
          80% { opacity: 0.8; transform: scale(0.98) translateY(2px); filter: blur(1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); filter: blur(0); }
        }
        
        @keyframes envelopeOpen {
          0% { transform: translateY(0); }
          20% { transform: translateY(-10px); }
          40% { transform: translateY(5px); }
          60% { transform: translateY(-3px); }
          80% { transform: translateY(1px); }
          100% { transform: translateY(0); }
        }
        
        @keyframes letterEmerge {
          0% { transform: scale(0.4) translateY(300px) rotateX(80deg); opacity: 0; filter: blur(10px) brightness(0.8); clip-path: inset(70% 0 0 0); }
          10% { transform: scale(0.5) translateY(250px) rotateX(70deg); opacity: 0.2; filter: blur(8px) brightness(0.9); clip-path: inset(60% 0 0 0); }
          20% { transform: scale(0.6) translateY(200px) rotateX(60deg); opacity: 0.3; filter: blur(6px) brightness(1); clip-path: inset(50% 0 0 0); }
          30% { transform: scale(0.7) translateY(150px) rotateX(50deg); opacity: 0.4; filter: blur(4px) brightness(1.1); clip-path: inset(40% 0 0 0); }
          40% { transform: scale(0.8) translateY(100px) rotateX(40deg); opacity: 0.6; filter: blur(3px) brightness(1.2); clip-path: inset(30% 0 0 0); }
          50% { transform: scale(0.9) translateY(50px) rotateX(30deg); opacity: 0.8; filter: blur(2px) brightness(1.3); clip-path: inset(20% 0 0 0); }
          60% { transform: scale(0.95) translateY(20px) rotateX(20deg); opacity: 0.9; filter: blur(1px) brightness(1.4); clip-path: inset(10% 0 0 0); }
          70% { transform: scale(1) translateY(5px) rotateX(10deg); opacity: 0.95; filter: blur(0.5px) brightness(1.5); clip-path: inset(5% 0 0 0); }
          80% { transform: scale(1.02) translateY(-5px) rotateX(5deg); opacity: 1; filter: blur(0) brightness(1.6); clip-path: inset(0% 0 0 0); }
          90% { transform: scale(1.01) translateY(2px) rotateX(2deg); opacity: 1; filter: blur(0) brightness(1.5); clip-path: inset(0% 0 0 0); }
          100% { transform: scale(1) translateY(0) rotateX(0); opacity: 1; filter: blur(0) brightness(1.4); clip-path: inset(0% 0 0 0); }
        }
        
        @keyframes letterGlow {
          0% { opacity: 0; background: linear-gradient(to bottom, rgba(255,255,200,0) 0%, rgba(255,255,200,0.05) 50%, rgba(255,255,200,0) 100%); }
          50% { opacity: 0.3; background: linear-gradient(to bottom, rgba(255,255,200,0.1) 0%, rgba(255,255,200,0.2) 50%, rgba(255,255,200,0.1) 100%); }
          100% { opacity: 0; background: linear-gradient(to bottom, rgba(255,255,200,0) 0%, rgba(255,255,200,0.05) 50%, rgba(255,255,200,0) 100%); }
        }
        
        @keyframes letterFinal {
          0% { transform: scale(0.9); opacity: 0; }
          30% { transform: scale(1.02); opacity: 0.8; }
          60% { transform: scale(0.98); opacity: 0.9; }
          100% { transform: scale(1); opacity: 1; }
        }
        
        /* Falling stars animations - DOWN with leftward drift */
        @keyframes falling-star-down {
          0% {
            transform: translateY(0) translateX(0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(calc(100vh + 100px)) translateX(calc(-1 * var(--drift-left))) rotate(360deg);
            opacity: 0;
          }
        }
        
        @keyframes star-trail {
          0% {
            background: radial-gradient(ellipse at center, 
              rgba(255, 255, 255, 0.8) 0%, 
              rgba(255, 255, 255, 0.6) 10%, 
              rgba(255, 255, 255, 0.4) 30%, 
              rgba(255, 255, 255, 0) 70%);
            width: 0px;
            height: 0px;
            opacity: 0;
            filter: blur(0px);
          }
          20% {
            background: radial-gradient(ellipse at center, 
              rgba(255, 255, 255, 0.9) 0%, 
              rgba(255, 255, 255, 0.7) 15%, 
              rgba(255, 255, 255, 0.5) 40%, 
              rgba(255, 255, 255, 0) 80%);
            width: 120px;
            height: 40px;
            opacity: 0.8;
            filter: blur(3px);
          }
          50% {
            background: radial-gradient(ellipse at center, 
              rgba(255, 255, 255, 0.95) 0%, 
              rgba(255, 255, 255, 0.8) 20%, 
              rgba(255, 255, 255, 0.6) 50%, 
              rgba(255, 255, 255, 0) 90%);
            width: 200px;
            height: 60px;
            opacity: 0.9;
            filter: blur(5px);
          }
          80% {
            background: radial-gradient(ellipse at center, 
              rgba(255, 255, 255, 0.7) 0%, 
              rgba(255, 255, 255, 0.5) 15%, 
              rgba(255, 255, 255, 0.3) 40%, 
              rgba(255, 255, 255, 0) 80%);
            width: 120px;
            height: 40px;
            opacity: 0.6;
            filter: blur(3px);
          }
          100% {
            background: radial-gradient(ellipse at center, 
              rgba(255, 255, 255, 0.3) 0%, 
              rgba(255, 255, 255, 0.2) 10%, 
              rgba(255, 255, 255, 0.1) 30%, 
              rgba(255, 255, 255, 0) 70%);
            width: 0px;
            height: 0px;
            opacity: 0;
            filter: blur(0px);
          }
        }
        
        @keyframes star-rotate {
          0% {
            transform: rotate(0deg) scale(1);
            filter: brightness(1) drop-shadow(0 0 15px currentColor);
          }
          25% {
            transform: rotate(90deg) scale(1.1);
            filter: brightness(1.3) drop-shadow(0 0 20px currentColor);
          }
          50% {
            transform: rotate(180deg) scale(1);
            filter: brightness(1) drop-shadow(0 0 25px currentColor);
          }
          75% {
            transform: rotate(270deg) scale(0.9);
            filter: brightness(0.8) drop-shadow(0 0 15px currentColor);
          }
          100% {
            transform: rotate(360deg) scale(1);
            filter: brightness(1) drop-shadow(0 0 15px currentColor);
          }
        }
        
        @keyframes twinkle {
          0% {
            opacity: 0.7;
            transform: scale(0.95);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          100% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
        
        /* Popup animations */
        @keyframes popup-in {
          0% {
            opacity: 0;
            transform: scale(0.8) translateY(20px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes glow {
          0% {
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 25px rgba(255, 255, 255, 0.8);
          }
          100% {
            box-shadow: 0 0 10px rgba(255, 255, 255, 0.5);
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        .animate-popup-in {
          animation: popup-in 0.3s ease-out forwards;
        }
        
        .animate-glow {
          animation: glow 2s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-falling-star-down {
          animation: falling-star-down linear forwards;
        }
        
        .animate-star-trail {
          animation: star-trail linear forwards;
          position: absolute;
          border-radius: 50%;
          z-index: 0;
        }
        
        .animate-star-rotate {
          animation: star-rotate linear infinite, twinkle ease-in-out 1s infinite;
          position: relative;
          z-index: 1;
        }
        
        .animate-sticker-wobble { animation: stickerWobble 1.2s ease-in-out forwards; }
        .animate-peel-container { transform-style: preserve-3d; }
        .animate-peel-sticker { animation: peelSticker 0.4s cubic-bezier(0.2, 0.8, 0.4, 1) forwards; transform-style: preserve-3d; backface-visibility: hidden; z-index: 2; }
        .animate-peel-shadow { animation: peelShadow 0.4s ease-out forwards; pointer-events: none; z-index: 1; }
        .animate-envelope-open { animation: envelopeOpen 0.8s ease-in-out forwards; }
        .animate-envelope-open-scale { animation: envelopeOpenScale 0.8s ease-out forwards; }
        .animate-envelope-open-reveal { animation: envelopeOpenReveal 0.8s ease-out forwards; }
        .animate-letter-emerge { animation: letterEmerge 0.8s cubic-bezier(0.2, 0.8, 0.4, 1) forwards; }
        .animate-letter-glow { animation: letterGlow 0.8s ease-in-out forwards; }
        .animate-letter-final { animation: letterFinal 0.5s ease-out forwards; }
        .relative { perspective: 1000px; }
      `}</style>
    </div>
  );
}

export default App;