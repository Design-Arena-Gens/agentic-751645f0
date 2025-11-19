'use client';

import { useState, useRef, useEffect } from 'react';

export default function Home() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [blur, setBlur] = useState(0);
  const [sharpness, setSharpness] = useState(100);
  const [selectedFilter, setSelectedFilter] = useState<string>('none');
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setOriginalImage(e.target?.result as string);
        resetFilters();
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setSharpness(100);
    setSelectedFilter('none');
  };

  const applyFilter = (filterName: string) => {
    setSelectedFilter(filterName);

    switch(filterName) {
      case 'vintage':
        setBrightness(110);
        setContrast(90);
        setSaturation(80);
        break;
      case 'vivid':
        setBrightness(105);
        setContrast(110);
        setSaturation(130);
        break;
      case 'cool':
        setBrightness(100);
        setContrast(105);
        setSaturation(110);
        break;
      case 'warm':
        setBrightness(105);
        setContrast(105);
        setSaturation(115);
        break;
      case 'blackwhite':
        setSaturation(0);
        setContrast(110);
        break;
      case 'professional':
        setBrightness(105);
        setContrast(108);
        setSaturation(105);
        setSharpness(110);
        break;
      default:
        resetFilters();
    }
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `enhanced-product-${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    }
  };

  const shareImage = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.toBlob(async (blob) => {
        if (blob) {
          const file = new File([blob], 'product-photo.png', { type: 'image/png' });

          if (navigator.share && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: 'Enhanced Product Photo',
                text: 'Check out my enhanced product photo!',
              });
            } catch (err) {
              console.log('Share cancelled');
            }
          } else {
            downloadImage();
          }
        }
      });
    }
  };

  useEffect(() => {
    if (originalImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;

        if (ctx) {
          // Apply filters
          let filterString = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

          if (blur > 0) {
            filterString += ` blur(${blur}px)`;
          }

          // Apply filter-specific color adjustments
          if (selectedFilter === 'cool') {
            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.max(0, data[i] - 10);     // Reduce red
              data[i + 2] = Math.min(255, data[i + 2] + 15); // Increase blue
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (selectedFilter === 'warm') {
            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] + 15);     // Increase red
              data[i + 1] = Math.min(255, data[i + 1] + 5); // Slight increase green
              data[i + 2] = Math.max(0, data[i + 2] - 10);  // Reduce blue
            }
            ctx.putImageData(imageData, 0, 0);
          } else if (selectedFilter === 'vintage') {
            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, data[i] + 20);     // Increase red
              data[i + 1] = Math.min(255, data[i + 1] + 10); // Increase green
              data[i + 2] = Math.max(0, data[i + 2] - 20);   // Reduce blue
            }
            ctx.putImageData(imageData, 0, 0);
          } else {
            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0);
          }

          // Apply sharpness (if different from 100)
          if (sharpness !== 100) {
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const sharpnessAmount = (sharpness - 100) / 100;
            ctx.putImageData(applySharpen(imageData, sharpnessAmount), 0, 0);
          }
        }
      };

      img.src = originalImage;
    }
  }, [originalImage, brightness, contrast, saturation, blur, sharpness, selectedFilter]);

  const applySharpen = (imageData: ImageData, amount: number): ImageData => {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    const output = new ImageData(width, height);

    const kernel = [
      0, -amount, 0,
      -amount, 1 + 4 * amount, -amount,
      0, -amount, 0
    ];

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) {
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const idx = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelIdx = (ky + 1) * 3 + (kx + 1);
              sum += data[idx] * kernel[kernelIdx];
            }
          }
          const outIdx = (y * width + x) * 4 + c;
          output.data[outIdx] = Math.max(0, Math.min(255, sum));
        }
        output.data[(y * width + x) * 4 + 3] = 255;
      }
    }

    return output;
  };

  return (
    <div className="container">
      <div className="header">
        <h1>✨ Product Photo Enhancer</h1>
        <p>Upload your product photo and create stunning professional results</p>
      </div>

      {!originalImage ? (
        <div className="upload-section">
          <div
            className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="upload-icon">📸</div>
            <h3>Drop your product photo here</h3>
            <p>or click to browse (JPG, PNG, WebP)</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            className="file-input"
            accept="image/*"
            onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
          />
        </div>
      ) : (
        <div className="editor-section">
          <div className="editor-grid">
            <div className="image-container">
              <h3>Original</h3>
              <img src={originalImage} alt="Original" className="image-preview" />
            </div>

            <div className="image-container">
              <h3>Enhanced</h3>
              <canvas ref={canvasRef} className="image-preview" />
            </div>
          </div>

          <div className="controls-panel">
            <div className="control-group">
              <label>
                Brightness
                <span>{brightness}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => {
                  setBrightness(Number(e.target.value));
                  setSelectedFilter('custom');
                }}
              />
            </div>

            <div className="control-group">
              <label>
                Contrast
                <span>{contrast}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => {
                  setContrast(Number(e.target.value));
                  setSelectedFilter('custom');
                }}
              />
            </div>

            <div className="control-group">
              <label>
                Saturation
                <span>{saturation}%</span>
              </label>
              <input
                type="range"
                min="0"
                max="200"
                value={saturation}
                onChange={(e) => {
                  setSaturation(Number(e.target.value));
                  setSelectedFilter('custom');
                }}
              />
            </div>

            <div className="control-group">
              <label>
                Sharpness
                <span>{sharpness}%</span>
              </label>
              <input
                type="range"
                min="50"
                max="150"
                value={sharpness}
                onChange={(e) => {
                  setSharpness(Number(e.target.value));
                  setSelectedFilter('custom');
                }}
              />
            </div>

            <div className="control-group">
              <label>
                Blur
                <span>{blur}px</span>
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={blur}
                onChange={(e) => {
                  setBlur(Number(e.target.value));
                  setSelectedFilter('custom');
                }}
              />
            </div>

            <div className="control-group">
              <label>Quick Filters</label>
              <div className="filter-buttons">
                <button
                  className={`filter-btn ${selectedFilter === 'professional' ? 'active' : ''}`}
                  onClick={() => applyFilter('professional')}
                >
                  Professional
                </button>
                <button
                  className={`filter-btn ${selectedFilter === 'vivid' ? 'active' : ''}`}
                  onClick={() => applyFilter('vivid')}
                >
                  Vivid
                </button>
                <button
                  className={`filter-btn ${selectedFilter === 'vintage' ? 'active' : ''}`}
                  onClick={() => applyFilter('vintage')}
                >
                  Vintage
                </button>
                <button
                  className={`filter-btn ${selectedFilter === 'cool' ? 'active' : ''}`}
                  onClick={() => applyFilter('cool')}
                >
                  Cool
                </button>
                <button
                  className={`filter-btn ${selectedFilter === 'warm' ? 'active' : ''}`}
                  onClick={() => applyFilter('warm')}
                >
                  Warm
                </button>
                <button
                  className={`filter-btn ${selectedFilter === 'blackwhite' ? 'active' : ''}`}
                  onClick={() => applyFilter('blackwhite')}
                >
                  B&W
                </button>
              </div>
            </div>

            <div className="action-buttons">
              <button className="btn btn-primary" onClick={downloadImage}>
                💾 Download Enhanced
              </button>
              <button className="btn btn-primary" onClick={shareImage}>
                🔗 Share
              </button>
              <button className="btn btn-secondary" onClick={resetFilters}>
                🔄 Reset
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setOriginalImage(null);
                  resetFilters();
                }}
              >
                📤 New Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
