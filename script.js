let pdfDoc = null;
let currentPageCanvas = null;
let signatureDataURL = null;
let signatureElement = null;

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

    // Create a wrapper div that is resizable
    const wrapper = document.createElement('div');
    wrapper.className = 'signature';
    wrapper.style.top = '50px';
    wrapper.style.left = '50px';
    wrapper.style.width = '150px';
    wrapper.style.height = '100px';

    // Create the image inside the wrapper
    const img = document.createElement('img');
    img.src = signatureDataURL;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.pointerEvents = 'none'; // Let div handle dragging/resizing

    wrapper.appendChild(img);
    makeElementDraggable(wrapper);

    document.getElementById('pdfContainer').appendChild(wrapper);
    signatureElement = wrapper;
  };
  reader.readAsDataURL(file);
});

function makeElementDraggable(elmnt) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  elmnt.onmousedown = dragMouseDown;

  function dragMouseDown(e) {
    if (e.target.tagName === 'IMG') return; // avoid dragging on image directly
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
  const sigRect = signatureElement.getBoundingClientRect();

  const x = sigRect.left - canvasRect.left;
  const y = canvasRect.height - (sigRect.top - canvasRect.top) - sigRect.height;
  const width = sigRect.width;
  const height = sigRect.height;

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
