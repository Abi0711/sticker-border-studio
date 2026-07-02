import React, { useState, useRef, useEffect } from 'react';
import './style.css'

interface ImageBorderCreatorProps{
    Files: string[] | undefined;
}

function drawSticker(
  file: string, 
  canvasRef: HTMLCanvasElement, 
  borderWidth: number, 
  borderColor: string,
  callback?: () => void
){
    const img = new Image();
    img.src = file;
    img.onload = () => {
      const canvas = canvasRef;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const padding = borderWidth * 2;
      canvas.width = img.width + padding * 2;
      canvas.height = img.height + padding * 2;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Center coordinates for drawing
      const x = padding;
      const y = padding;

      if (borderWidth > 0) {
        // 2. Create a temporary offscreen canvas to isolate the image silhouette
        const alphaCanvas = document.createElement('canvas');
        alphaCanvas.width = canvas.width;
        alphaCanvas.height = canvas.height;
        const alphaCtx = alphaCanvas.getContext('2d');
        
        // Draw the border of image 
        if (alphaCtx) {
          alphaCtx.drawImage(img, x, y);
          // Source-in composite mode replaces all visible pixels with the border color
          alphaCtx.globalCompositeOperation = 'source-in';
          alphaCtx.fillStyle = borderColor;
          alphaCtx.fillRect(0, 0, canvas.width, canvas.height);
          
          // This creates a solid, uniform outline following the exact pixel boundary
          const quality = 32; // Higher numbers = smoother round corners
          for (let i = 0; i < quality; i++) {
            const angle = (i / quality) * Math.PI * 2;
            const offsetX = Math.cos(angle) * borderWidth;
            const offsetY = Math.sin(angle) * borderWidth;
            ctx.drawImage(alphaCanvas, offsetX, offsetY);
          }
        }
      }

      //draws original image
      ctx.drawImage(img, x, y);
      // once image has completed rendering, download
    if (callback) callback();
    };
}

function ImageBorderCreator({Files}:ImageBorderCreatorProps) {
  const [borderWidth, setBorderWidth] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#ffffff');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [currentWidth, setCurrentWidth] = useState<number>();
  const [currentHeight, setCurrentHeight] = useState<number>();



  const moveLeft = () => {
    if (!Files || Files.length === 0) return;
    setCurrentIndex((prevIndex)=> prevIndex === 0 ? 0 : prevIndex - 1);
    const img = new Image();
    img.src = Files[currentIndex];
      img.onload = () => {
        setCurrentWidth(img.width)
        setCurrentHeight(img.height) 
      }
  }

  const moveRight = () => {
    if (!Files || Files.length === 0) return;
    setCurrentIndex((prevIndex)=> prevIndex === Files.length - 1 ? Files.length - 1 : prevIndex + 1);
    const img = new Image();
    img.src = Files[currentIndex];
      img.onload = () => {
        setCurrentWidth(img.width)
        setCurrentHeight(img.height) 
      }
  }

  useEffect(() => {
    setCurrentIndex(0);
    if(Files){
      const img = new Image();
      img.src = Files[currentIndex];
      img.onload = () => {
        setCurrentWidth(img.width)
        setCurrentHeight(img.height) 
      }

    }
  }, [Files]);

  useEffect(() => {
    if (!Files || Files.length === 0 || !canvasRef.current) return;
    drawSticker(Files[currentIndex], canvasRef.current, borderWidth, borderColor);
  }, [Files, currentIndex, borderWidth, borderColor]); //when user input changes uploaded file or border width or colour, execute function

  const downloadSticker = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.download = 'sticker-ready.png';
    link.href = canvas.toDataURL('image/png'); 
    link.click();
  };

  const downloadAllStickers = () => {
    if(!Files || Files.length === 0) return;
    Files.forEach((fileUrl, index) =>{
        const tempCanvas = document.createElement('canvas');
        drawSticker(fileUrl, tempCanvas, borderWidth, borderColor, () => {
        // Download once the image has been rendered
        const link = document.createElement('a');
        link.download = `sticker-${index + 1}.png`;
        link.href = tempCanvas.toDataURL('image/png');
        link.click();
      });
    });
  };

  return (
    <div className='border-creator'>
      <h2>Sticker Border Editor</h2>
      
      {/* && is JS conditional parameter. so if there is an image then return right side
      else just return null (which is ignored when rendering) */}
      {Files && (
        <div className='border-display-container'>
          <div className='options-container'>
            {Files.length > 1 && (
              <div className="carousel-controls">
                
                {currentIndex > 0 &&
                <button onClick={moveLeft}>◀ Prev</button>
                }
                <span className='image-carousel-span'>Image {currentIndex + 1} of {Files.length}</span>
                {currentIndex < Files.length - 1 &&
                    <button onClick={moveRight}>Next ▶</button>
                }
                
              </div>
            )}

            <label className='border-thickness'>
              Border Thickess: 
              <input type="number" min="0" max="200" value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value))} />
              <input type="range" min="0" max="200" value={borderWidth} onChange={(e) => setBorderWidth(Number(e.target.value))} />
            </label>
            <label className='border-colour-label'>
              Border Color: 
              <input type="color" value={borderColor} onChange={(e) => setBorderColor(e.target.value)} />
            </label>
            <div className='advanced-options'>
              <p>image width: {currentWidth}</p>
              <p>image height: {currentHeight}</p>
            </div>


            <button className='download-button' onClick={downloadSticker}>Download PNG</button>
            {Files.length > 1 &&
                <button className='download-button' onClick={downloadAllStickers}>Apply border to all images and download</button>
            }

          </div>
          
          <div className='canvas-container'>
            <canvas className='canvas-img' ref={canvasRef} />
          </div>
        </div>
      )}
    </div>
  );
};
export default ImageBorderCreator;