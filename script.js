let scene, camera, renderer, currentShape, controls;
let particles = [];
let currentShapeType = 'cube';

// 默认参数
const DEFAULT_PARAMS = {
    particleSize: 0.02,
    particleCount: 2000,
    shapeSize: 1
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
}

function resetParameters() {
    currentParams = { ...DEFAULT_PARAMS };
    
    // 更新控制面板显示
    document.getElementById('particleSize').value = currentParams.particleSize;
    document.getElementById('particleSizeValue').textContent = currentParams.particleSize;
    document.getElementById('particleCount').value = currentParams.particleCount;
    document.getElementById('particleCountValue').textContent = currentParams.particleCount;
    document.getElementById('shapeSize').value = currentParams.shapeSize;
    document.getElementById('shapeSizeValue').textContent = currentParams.shapeSize;
    
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
    const particles = [];
    
    for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i] * currentParams.shapeSize;
        const y = positions[i + 1] * currentParams.shapeSize;
        const z = positions[i + 2] * currentParams.shapeSize;
        
        const particleGeometry = new THREE.SphereGeometry(currentParams.particleSize, 8, 8);
        const particleMaterial = new THREE.MeshPhongMaterial({
            color: colorPicker.value,
            shininess: 100
        });
        
        const particle = new THREE.Mesh(particleGeometry, particleMaterial);
        particle.position.set(x, y, z);
        particles.push(particle);
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
    const segments = Math.floor(Math.sqrt(currentParams.particleCount / 4));
    const geometry = new THREE.SphereGeometry(1, segments, segments);
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
    changeShape(currentShapeType);
}

function changeShape(shapeType) {
    currentShapeType = shapeType;
    
    // 移除当前形状
    if (currentShape) {
        scene.remove(currentShape);
    }
    
    // 创建新形状
    switch(shapeType) {
        case 'cube':
            currentShape = createCube();
            break;
        case 'sphere':
            currentShape = createSphere();
            break;
        case 'tree':
            currentShape = createTree();
            break;
        case 'torus':
            currentShape = createTorus();
            break;
    }
    
    scene.add(currentShape);
}

function animate() {
    requestAnimationFrame(animate);
    
    if (controls) {
        controls.update();
    }
    
    renderer.render(scene, camera);
}

// 处理窗口大小变化
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
});

// 初始化场景
init();