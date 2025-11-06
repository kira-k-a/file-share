const form = document.getElementById('uploadForm');
const customFileButton = document.getElementById('customFileButton');
const fileName = document.getElementById('fileName');
const progress = document.getElementById('progress');
const status = document.getElementById('status');
const progressContainer = document.getElementById('progressContainer');
const result = document.getElementById('result');
const downloadLink = document.getElementById('downloadLink');
const downloadText = document.getElementById('downloadText');
const errorBox = document.getElementById('error');
const refreshStatsButton = document.getElementById('refreshStats');
const statsContainer = document.getElementById('statsContainer');

const API_BASE = 'http://localhost:4000/api';

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

let selectedFileName = '';

customFileButton.addEventListener('click', () => {
  fileInput.click();
});

fileInput.addEventListener('change', () => {
  if (fileInput.files.length > 0) {
    const file = fileInput.files[0];
    selectedFileName = file.name;
    fileName.textContent = selectedFileName;
  } else {
    selectedFileName = '';
    fileName.textContent = 'Файл не выбран';
  }
});

function loadStats() {
  statsContainer.innerHTML = '<div class="loading">Загрузка статистики...</div>';
  
  fetch(`${API_BASE}/stats`)
    .then(response => {
      if (!response.ok) throw new Error('Ошибка загрузки статистики');
      return response.json();
    })
    .then(files => {
      if (files.length === 0) {
        statsContainer.innerHTML = '<div class="empty-stats">Файлы не найдены</div>';
        return;
      }

      const table = document.createElement('table');
      table.className = 'stats-table';
      
      table.innerHTML = `
        <thead>
          <tr>
            <th>Имя файла</th>
            <th>Дата загрузки</th>
            <th>Последнее скачивание</th>
            <th>Ссылка для скачивания</th>
          </tr>
        </thead>
        <tbody>
          ${files.map(file => `
            <tr>
              <td>${escapeHtml(file.name)}</td>
              <td>${formatDate(file.createdAt)}</td>
              <td>${formatDate(file.lastDownloaded)}</td>
              <td class="download-link-cell">
                <a href="${file.downloadLink}" target="_blank">Скачать</a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      `;
      
      statsContainer.innerHTML = '';
      statsContainer.appendChild(table);
    })
    .catch(error => {
      console.error('Error loading stats:', error);
      statsContainer.innerHTML = `<div class="error">Ошибка загрузки статистики: ${error.message}</div>`;
    });
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(timestamp) {
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString('ru-RU');
}

refreshStatsButton.addEventListener('click', loadStats);

form.addEventListener('submit', e => {
  e.preventDefault();
  const file = fileInput.files[0];
  if (!file) {
    errorBox.textContent = 'Пожалуйста, выберите файл';
    errorBox.hidden = false;
    return;
  }

  const fd = new FormData();
  fd.append('file', file);

  const xhr = new XMLHttpRequest();
  xhr.open('POST', `${API_BASE}/upload`);

  xhr.upload.addEventListener('progress', ev => {
    if (!ev.lengthComputable) return;
    const percent = Math.round((ev.loaded / ev.total) * 100);
    progress.value = percent;
    status.textContent = percent + '%';
    progressContainer.hidden = false;
  });

  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      progressContainer.hidden = true;

      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        const link = data.link;

        downloadText.textContent = `Ссылка на скачивание файла "${selectedFileName}":`;
        
        downloadLink.href = link;
        downloadLink.textContent = link;
        downloadLink.style.display = 'inline-block';
        result.hidden = false;
        errorBox.hidden = true;
        
        fileInput.value = '';
        fileName.textContent = 'Файл не выбран';
        selectedFileName = '';

        loadStats();
      } else {
        let msg = 'Ошибка при загрузке файла';
        try {
          msg = JSON.parse(xhr.responseText).error || xhr.statusText;
        } catch (e) {}
        errorBox.textContent = msg;
        errorBox.hidden = false;
      }

      progress.value = 0;
      status.textContent = '0%';
    }
  };

  xhr.send(fd);
});

document.addEventListener('DOMContentLoaded', loadStats);