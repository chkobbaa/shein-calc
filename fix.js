const fs = require('fs');
let content = fs.readFileSync('style.css');

// style.css should end with 'opacity: 1; }' around line 402. Let's find this.
const validStr = 'opacity: 1; }\n';
let idx = content.indexOf(validStr);

if (idx !== -1) {
    // Keep everything up to the end of the valid string
    const cleanBuffer = content.slice(0, idx + validStr.length);
    fs.writeFileSync('style.css', cleanBuffer);

    // Append our new CSS properly encoded
    const newCss = `
/* File Upload Zone */
.file-drop-area { position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 30px 20px; border: 2px dashed var(--border-col); border-radius: 16px; background: var(--bg-color); cursor: pointer; transition: all 0.2s; text-align: center; }
.file-drop-area:hover, .file-drop-area.dragover { border-color: var(--primary); background: rgba(255, 64, 129, 0.03); }
.file-drop-area .drop-icon { font-size: 3rem; color: var(--primary); margin-bottom: 10px; }
.file-drop-area .drop-msg { font-size: 0.95rem; font-weight: 700; color: var(--text-muted); }
.file-drop-area input[type='file'] { position: absolute; left: 0; top: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; }
.image-preview-container { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 15px; }
.image-preview { width: 80px; height: 80px; border-radius: 10px; object-fit: cover; border: 1px solid var(--border-col); box-shadow: 0 2px 5px rgba(0,0,0,0.05); }
`;
    fs.appendFileSync('style.css', newCss);
    console.log("CSS Fixed");
} else {
    console.log("Could not find the anchor text.");
}
