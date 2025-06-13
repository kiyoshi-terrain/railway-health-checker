// railway-photos.js - 写真アップロード機能

// ========================================
// 共通写真アップロード処理
// ========================================
function handlePhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('photoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                uploadedPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove" onclick="removePhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

function removePhoto(photoId) {
    uploadedPhotos = uploadedPhotos.filter(p => p.id !== photoId);
    document.getElementById('photoPreview').innerHTML = '';
    uploadedPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove" onclick="removePhoto(${photo.id})">×</button>
        `;
        document.getElementById('photoPreview').appendChild(photoItem);
    });
}

// ========================================
// 盛土変状用写真アップロード
// ========================================
function handleDefectPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('defectPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempDefectPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempDefectPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
                
                // 位置情報が空の場合、写真から取得を試みる
                if (!document.getElementById('latitude').value && !document.getElementById('longitude').value) {
                    checkPhotoLocation(file);
                }
            };
            reader.readAsDataURL(file);
        }
    }
}

function removeTempDefectPhoto(photoId) {
    tempDefectPhotos = tempDefectPhotos.filter(p => p.id !== photoId);
    updateDefectPhotoPreview();
}

function updateDefectPhotoPreview() {
    const preview = document.getElementById('defectPhotoPreview');
    preview.innerHTML = '';
    tempDefectPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempDefectPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// ========================================
// 盛土不安定性用写真アップロード
// ========================================
function handleInstabilityPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('instabilityPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempInstabilityPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempInstabilityPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

function removeTempInstabilityPhoto(photoId) {
    tempInstabilityPhotos = tempInstabilityPhotos.filter(p => p.id !== photoId);
    updateInstabilityPhotoPreview();
}

function updateInstabilityPhotoPreview() {
    const preview = document.getElementById('instabilityPhotoPreview');
    preview.innerHTML = '';
    tempInstabilityPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempInstabilityPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// ========================================
// 切土変状用写真アップロード
// ========================================
function handleCuttingDefectPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('cuttingDefectPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempCuttingDefectPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${e.target.result}" alt="${file.name}">
                    <button class="remove-mini" onclick="removeTempCuttingDefectPhoto(${photoId})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

function removeTempCuttingDefectPhoto(photoId) {
    tempCuttingDefectPhotos = tempCuttingDefectPhotos.filter(p => p.id !== photoId);
    updateCuttingDefectPhotoPreview();
}

function updateCuttingDefectPhotoPreview() {
    const preview = document.getElementById('cuttingDefectPhotoPreview');
    preview.innerHTML = '';
    tempCuttingDefectPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempCuttingDefectPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// ========================================
// 切土不安定性用写真アップロード
// ========================================
function handleCuttingInstabilityPhotoUpload(event) {
    const files = event.target.files;
    const preview = document.getElementById('cuttingInstabilityPhotoPreview');
    
    for (let file of files) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                const photoId = Date.now() + Math.random();
                tempCuttingInstabilityPhotos.push({
                    id: photoId,
                    data: e.target.result,
                    name: file.name
                });
                
                const photoItem = document.createElement('div');
                photoItem.className = 'photo-item-mini';
                photoItem.innerHTML = `
                    <img src="${photo.data}" alt="${photo.name}">
                    <button class="remove-mini" onclick="removeTempCuttingInstabilityPhoto(${photo.id})">×</button>
                `;
                preview.appendChild(photoItem);
            };
            reader.readAsDataURL(file);
        }
    }
}

function removeTempCuttingInstabilityPhoto(photoId) {
    tempCuttingInstabilityPhotos = tempCuttingInstabilityPhotos.filter(p => p.id !== photoId);
    updateCuttingInstabilityPhotoPreview();
}

function updateCuttingInstabilityPhotoPreview() {
    const preview = document.getElementById('cuttingInstabilityPhotoPreview');
    preview.innerHTML = '';
    tempCuttingInstabilityPhotos.forEach(photo => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item-mini';
        photoItem.innerHTML = `
            <img src="${photo.data}" alt="${photo.name}">
            <button class="remove-mini" onclick="removeTempCuttingInstabilityPhoto(${photo.id})">×</button>
        `;
        preview.appendChild(photoItem);
    });
}

// ========================================
// 写真プレビューモーダル（未実装）
// ========================================
function showPhotoPreview(photos, title) {
    // TODO: 写真プレビューモーダルの実装
    alert(`${title}の写真: ${photos.length}枚`);
}