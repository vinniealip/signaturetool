let pdfDoc = null;
let currentPageCanvas = null;
let signatureImg = null;
let signatureElement = null;
let signatureDataURL = null;

document.getElementById('pdfUpload').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  const fileReader = new FileReader();
  fileReader.onload = async function () {
    const typedarray = new Uint8Array(this.result);
    const loadingTask = pdfjsLib.getDocument({ data: typedarray });
    pdfDoc = await loadingTask.promise;

    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    currentPageCanvas = canvas;

    const context = canvas.getContext('2d');
    await page.render({ canvasContext: context, viewport: viewport }).promise;

    const container = document.getElementById('pdfContainer');
    container.innerHTML = '';
    container.appendChild(canvas);
  };
  fileReader.readAsArrayBuffer(file);
});

document.getElementById('signatureUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (evt) {
    signatureDataURL = evt.target.result;
    signatureElement = document.createElement('img');
    signatureElement.src = signatureDataURL;
    signatureElement.className = 'signature';
    signatureElement.style.top = '20px';
    signatureElement.style.left = '20px';
    signatureElement.style.width = '150px';

    makeElementDraggable(signatureElement);

    document.getElementById('pdfContainer').appendChild(signatureElement);
  };
  reader.readAsDataURL(file);
});

function makeElementDraggable(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    e.preventDefault();
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.onmouseup = closeDragElement;
    document.onmousemove = elementDrag;
  }

  function elementDrag(e) {
    e.preventDefault();
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
    elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
  }

  function closeDragElement() {
    document.onmouseup = null;
    document.onmousemove = null;
  }
}

document.getElementById('savePdf').addEventListener('click', async () => {
  if (!signatureElement || !currentPageCanvas) {
    alert('Please upload both a PDF and a signature first.');
    return;
  }

  const pdfBytes = await pdfDoc.getData();
  const pdfDocModified = await PDFLib.PDFDocument.load(pdfBytes);
  const page = pdfDocModified.getPage(0);

  const pngImage = await pdfDocModified.embedPng(signatureDataURL);

  const canvasRect = currentPageCanvas.getBoundingClientRect();
  const imgRect = signatureElement.getBoundingClientRect();

  const x = imgRect.left - canvasRect.left;
  const y = canvasRect.height - (imgRect.top - canvasRect.top) - imgRect.height;
  const width = imgRect.width;
  const height = imgRect.height;

  page.drawImage(pngImage, {
    x,
    y,
    width,
    height,
  });

  const pdfBytesModified = await pdfDocModified.save();
  const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'signed.pdf';
  link.click();
});
