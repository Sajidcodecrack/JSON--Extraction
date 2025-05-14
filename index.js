const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const Tesseract = require('tesseract.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/extract-json', async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64 || !imageBase64.startsWith('data:image/png;base64,')) {
      return res.status(400).json({ success: false, message: 'Invalid image format' });
    }

    const base64Data = imageBase64.replace(/^data:image\/png;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');

   const result = await Tesseract.recognize(imageBuffer, 'eng', {
  logger: m => console.log(m),
});

let extractedText = result.data.text;
console.log("🧠 OCR Raw Output:", extractedText);

// Add cleanup logic
let cleanedText = extractedText
  .trim()
  .replace(/\n/g, '')
  .replace(/\r/g, '')
  .replace(/“|”/g, '"')
  .replace(/‘|’/g, "'")
  .replace(/(\w)\s*:\s*(\w)/g, '$1:$2') // fix spacing around colons
  .replace(/\\'/g, "'");

console.log("🧹 Cleaned Text:", cleanedText);

    // Extract JSON block
    let jsonStart = cleanedText.indexOf('{');
    let jsonEnd = cleanedText.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error('JSON not found in image');
    }

    let jsonText = cleanedText.substring(jsonStart, jsonEnd + 1);
    let extractedData = JSON.parse(jsonText);

    return res.json({
      success: true,
      data: extractedData,
      message: 'Successfully extracted JSON from image',
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to extract JSON from image',
    });
  }
});

app.listen(PORT, () => {
  console.log(` Server running at http://localhost:${PORT}`);
});
