document.getElementById('signatureUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  const reader = new FileReader();
  reader.onload = function (evt) {
    signatureDataURL = evt.target.result;

    const wrapper = document.createElement('div');
    wrapper.className = 'signature';
    wrapper.style.top = '20px';
    wrapper.style.left = '20px';
    wrapper.style.width = '150px';
    wrapper.style.height = 'auto';

    const img = document.createElement('img');
    img.src = signatureDataURL;
    img.style.width = '100%';
    img.style.height = '100%';
    img.style.pointerEvents = 'none'; // Prevents interference with drag

    wrapper.appendChild(img);
    makeElementDraggable(wrapper);
    document.getElementById('pdfContainer').appendChild(wrapper);

    signatureElement = wrapper;
  };
  reader.readAsDataURL(file);
});
