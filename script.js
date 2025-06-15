let scene, camera, renderer, currentShape, controls;
let particles = [];
let currentShapeType = 'cube';
let isTransitioning = false;
let transitionProgress = 0;
let oldParticles = [];
let targetParticles = [];
let colorPicker;

let isColorMode = false;  // 添加彩色模式标志

// 预定义的颜色组合
const COLOR_PALETTES = [
    ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4'],
    ['#FF9F1C', '#FFBF69', '#FFFFFF', '#CBF3F0'],
    ['#2A9D8F', '#E9C46A', '#F4A261', '#E76F51'],
    ['#9B5DE5', '#F15BB5', '#FEE440', '#00BBF9'],
    ['#FF006E', '#FB5607', '#8338EC', '#3A86FF']
];

// 默认参数
const DEFAULT_PARAMS = {
    particleSize: 0.01,
    particleCount: 2000,
    shapeSize: 1,
    layerCount: 5,
    layerOffset: 0.05,
    randomOffset: 0.05
};

// 当前参数
let currentParams = { ...DEFAULT_PARAMS };

function init() {
    // 创建场景
    scene = new THREE.Scene();
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // 添加轨道控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    
    // 添加环境光
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // 添加平行光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 1, 0);
    scene.add(directionalLight);

    // 添加颜色选择器
    addColorPicker();
    
    // 初始化控制面板
    initControls();
    
    // 默认显示立方体
    changeShape('cube');
    
    // 开始动画循环
    animate();
}

function initControls() {
    // 粒子大小控制
    const particleSizeInput = document.getElementById('particleSize');
    const particleSizeValue = document.getElementById('particleSizeValue');
    particleSizeInput.value = currentParams.particleSize;
    particleSizeValue.textContent = currentParams.particleSize;
    particleSizeInput.addEventListener('input', (e) => {
        currentParams.particleSize = parseFloat(e.target.value);
        particleSizeValue.textContent = currentParams.particleSize;
        updateCurrentShape();
    });

    // 粒子数量控制
    const particleCountInput = document.getElementById('particleCount');
    const particleCountValue = document.getElementById('particleCountValue');
    particleCountInput.value = currentParams.particleCount;
    particleCountValue.textContent = currentParams.particleCount;
    particleCountInput.addEventListener('input', (e) => {
        currentParams.particleCount = parseInt(e.target.value);
        particleCountValue.textContent = currentParams.particleCount;
        updateCurrentShape();
    });

    // 形状大小控制
    const shapeSizeInput = document.getElementById('shapeSize');
    const shapeSizeValue = document.getElementById('shapeSizeValue');
    shapeSizeInput.value = currentParams.shapeSize;
    shapeSizeValue.textContent = currentParams.shapeSize;
    shapeSizeInput.addEventListener('input', (e) => {
        currentParams.shapeSize = parseFloat(e.target.value);
        shapeSizeValue.textContent = currentParams.shapeSize;
        updateCurrentShape();
    });

    // 层间距控制
    const layerOffsetInput = document.getElementById('layerOffset');
    const layerOffsetValue = document.getElementById('layerOffsetValue');
    layerOffsetInput.value = currentParams.layerOffset;
    layerOffsetValue.textContent = currentParams.layerOffset;
    layerOffsetInput.addEventListener('input', (e) => {
        currentParams.layerOffset = parseFloat(e.target.value);
        layerOffsetValue.textContent = currentParams.layerOffset;
        updateCurrentShape();
    });

    // 随机偏移控制
    const randomOffsetInput = document.getElementById('randomOffset');
    const randomOffsetValue = document.getElementById('randomOffsetValue');
    randomOffsetInput.value = currentParams.randomOffset;
    randomOffsetValue.textContent = currentParams.randomOffset;
    randomOffsetInput.addEventListener('input', (e) => {
        currentParams.randomOffset = parseFloat(e.target.value);
        randomOffsetValue.textContent = currentParams.randomOffset;
        updateCurrentShape();
    });
}

function resetParameters() {
    currentParams = { ...DEFAULT_PARAMS };
    
    // 更新所有控制面板显示
    const controls = {
        'particleSize': currentParams.particleSize,
        'particleCount': currentParams.particleCount,
        'shapeSize': currentParams.shapeSize,
        'layerOffset': currentParams.layerOffset,
        'randomOffset': currentParams.randomOffset
    };
    
    Object.entries(controls).forEach(([key, value]) => {
        document.getElementById(key).value = value;
        document.getElementById(key + 'Value').textContent = value;
    });
    
    updateCurrentShape();
}

function addColorPicker() {
    const colorPickerContainer = document.createElement('div');
    colorPickerContainer.style.position = 'absolute';
    colorPickerContainer.style.top = '10px';
    colorPickerContainer.style.right = '10px';
    colorPickerContainer.style.zIndex = '1000';
    
    colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.value = '#00ff00';
    colorPicker.style.width = '50px';
    colorPicker.style.height = '50px';
    colorPicker.style.border = 'none';
    colorPicker.style.borderRadius = '5px';
    colorPicker.style.cursor = 'pointer';
    
    colorPicker.addEventListener('input', (e) => {
        if (currentShape) {
            currentShape.children.forEach(particle => {
                particle.material.color.set(e.target.value);
            });
        }
    });
    
    colorPickerContainer.appendChild(colorPicker);
    document.body.appendChild(colorPickerContainer);
}

function createParticles(geometry) {
    const positions = geometry.attributes.position.array;
    const normals = geometry.attributes.normal.array;
    const particles = [];
    
    // 计算每层的粒子数量
    const particlesPerLayer = Math.floor(currentParams.particleCount / currentParams.layerCount);
    
    // 为每一层创建粒子
    for (let layer = 0; layer < currentParams.layerCount; layer++) {
        const layerOffset = layer * currentParams.layerOffset;
        
        // 为当前层创建粒子
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            // 获取法线方向
            const nx = normals[i];
            const ny = normals[i + 1];
            const nz = normals[i + 2];
            
            // 计算偏移后的位置
            const offsetX = x + nx * layerOffset;
            const offsetY = y + ny * layerOffset;
            const offsetZ = z + nz * layerOffset;
            
            // 添加随机偏移
            const randomX = (Math.random() - 0.5) * currentParams.randomOffset;
            const randomY = (Math.random() - 0.5) * currentParams.randomOffset;
            const randomZ = (Math.random() - 0.5) * currentParams.randomOffset;
            
            const particleGeometry = new THREE.SphereGeometry(currentParams.particleSize, 8, 8);
            const particleMaterial = new THREE.MeshPhongMaterial({
                color: isColorMode ? COLOR_PALETTES[0][Math.floor(Math.random() * COLOR_PALETTES[0].length)] : colorPicker.value,
                shininess: 100,
                transparent: true,
                opacity: 1 - (layer * 0.2)
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(
                (offsetX + randomX) * currentParams.shapeSize,
                (offsetY + randomY) * currentParams.shapeSize,
                (offsetZ + randomZ) * currentParams.shapeSize
            );
            
            particles.push(particle);
        }
    }
    
    return particles;
}

function createCube() {
    const group = new THREE.Group();
    const segments = Math.floor(Math.sqrt(currentParams.particleCount / 6));
    const geometry = new THREE.BoxGeometry(2, 2, 2, segments, segments, segments);
    const particles = createParticles(geometry);
    particles.forEach(particle => group.add(particle));
    return group;
}

function createSphere() {
    const group = new THREE.Group();
    // 调整球体的分段数，使密度适中
    const segments = Math.floor(Math.sqrt(currentParams.particleCount / 2));
    const geometry = new THREE.SphereGeometry(1, segments * 1.5, segments * 1.5);
    const particles = createParticles(geometry);
    particles.forEach(particle => group.add(particle));
    return group;
}

function createTree() {
    const group = new THREE.Group();
    
    // 树干
    const trunkSegments = Math.floor(Math.sqrt(currentParams.particleCount / 4));
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1, trunkSegments, trunkSegments);
    const trunkParticles = createParticles(trunkGeometry);
    trunkParticles.forEach(particle => {
        particle.position.y -= 0.5;
        group.add(particle);
    });
    
    // 树冠
    const leavesSegments = Math.floor(Math.sqrt(currentParams.particleCount / 2));
    const leavesGeometry = new THREE.ConeGeometry(1, 2, leavesSegments, leavesSegments);
    const leavesParticles = createParticles(leavesGeometry);
    leavesParticles.forEach(particle => {
        particle.position.y += 1;
        group.add(particle);
    });
    
    return group;
}

function createTorus() {
    const group = new THREE.Group();
    const segments = Math.floor(Math.sqrt(currentParams.particleCount / 2));
    const geometry = new THREE.TorusGeometry(1, 0.3, segments, segments * 2);
    const particles = createParticles(geometry);
    particles.forEach(particle => group.add(particle));
    return group;
}

function updateCurrentShape() {
    if (!isTransitioning) {
        changeShape(currentShapeType);
    }
}

function changeShape(shapeType) {
    if (isTransitioning) return;
    
    currentShapeType = shapeType;
    isTransitioning = true;
    transitionProgress = 0;
    
    // 保存当前粒子的位置
    oldParticles = [];
    if (currentShape) {
        currentShape.children.forEach(particle => {
            oldParticles.push({
                position: particle.position.clone(),
                scale: particle.scale.clone()
            });
        });
    }
    
    // 创建新形状但暂时不添加到场景
    let newShape;
    switch(shapeType) {
        case 'cube':
            newShape = createCube();
            break;
        case 'sphere':
            newShape = createSphere();
            break;
        case 'tree':
            newShape = createTree();
            break;
        case 'torus':
            newShape = createTorus();
            break;
    }
    
    // 保存目标粒子的位置
    targetParticles = [];
    newShape.children.forEach(particle => {
        targetParticles.push({
            position: particle.position.clone(),
            scale: particle.scale.clone()
        });
    });
    
    // 如果当前有形状，先移除它
    if (currentShape) {
        scene.remove(currentShape);
    }
    
    // 将新形状添加到场景
    currentShape = newShape;
    scene.add(currentShape);
    
    // 立即将新形状的粒子移动到起始位置
    currentShape.children.forEach((particle, index) => {
        if (oldParticles[index]) {
            particle.position.copy(oldParticles[index].position);
            particle.scale.copy(oldParticles[index].scale);
        }
    });
}

function easeInOutCubic(t) {
    return t < 0.5
        ? 4 * t * t * t
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function animate() {
    requestAnimationFrame(animate);
    
    if (controls) {
        controls.update();
    }
    
    // 处理形状过渡动画
    if (isTransitioning && currentShape) {
        transitionProgress += 0.02; // 控制过渡速度
        
        if (transitionProgress >= 1) {
            isTransitioning = false;
            transitionProgress = 1;
        }
        
        // 使用缓动函数使动画更平滑
        const easeProgress = easeInOutCubic(transitionProgress);
        
        // 更新每个粒子的位置和大小
        currentShape.children.forEach((particle, index) => {
            if (oldParticles[index] && targetParticles[index]) {
                // 位置插值
                particle.position.lerpVectors(
                    oldParticles[index].position,
                    targetParticles[index].position,
                    easeProgress
                );
                
                // 大小插值
                particle.scale.lerpVectors(
                    oldParticles[index].scale,
                    targetParticles[index].scale,
                    easeProgress
                );
            }
        });
    }
    
    renderer.render(scene, camera);
}

function toggleColorMode() {
    isColorMode = !isColorMode;
    if (isColorMode) {
        // 随机选择一个颜色组合
        const randomPalette = COLOR_PALETTES[Math.floor(Math.random() * COLOR_PALETTES.length)];
        if (currentShape) {
            currentShape.children.forEach(particle => {
                // 为每个粒子随机选择一个颜色
                const randomColor = randomPalette[Math.floor(Math.random() * randomPalette.length)];
                particle.material.color.set(randomColor);
            });
        }
    } else {
        // 恢复单色模式
        if (currentShape) {
            currentShape.children.forEach(particle => {
                particle.material.color.set(colorPicker.value);
            });
        }
    }
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
});

// 初始化场景
init();