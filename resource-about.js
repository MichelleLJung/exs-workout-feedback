/* Shared, on-demand resource credit. No storage, analytics, or network requests. */
(() => {
  'use strict';
  if (typeof HTMLDialogElement === 'undefined' ||
      typeof HTMLDialogElement.prototype.showModal !== 'function') return;

  let dialog;
  let opener;
  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-resource-about]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    opener = link;
    if (!dialog) {
      dialog = document.createElement('dialog');
      dialog.className = 'mlj-about-dialog';
      dialog.setAttribute('aria-labelledby', 'mlj-about-title');
      dialog.innerHTML = '<h2 id="mlj-about-title">About this tool</h2>' +
        '<p>Created by Michelle L. Jung with generative AI assistance in design, content development, and coding.</p>' +
        '<p>I review and test each activity and verify its instructional content and accuracy before publication.</p>' +
        '<p><a class="mlj-about-licensing">Licensing &amp; educational disclaimer</a></p>' +
        '<div class="mlj-about-actions"><button class="mlj-about-close" type="button" autofocus>Close</button></div>';
      document.body.appendChild(dialog);
      dialog.querySelector('.mlj-about-close').addEventListener('click', () => dialog.close());
      dialog.addEventListener('close', () => {
        if (opener && opener.isConnected) opener.focus();
      });
      dialog.addEventListener('click', event => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right ||
            event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
      });
    }
    dialog.querySelector('.mlj-about-licensing').href = link.href;
    if (!dialog.open) dialog.showModal();
  });
})();
