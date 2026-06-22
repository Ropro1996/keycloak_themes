import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Define animated element interface
interface AnimatedElement {
  mesh: THREE.Mesh;
  type: 'pulse' | 'float';
  phase: number;
}

// Define application interface
interface AppDefinition {
  id: string;
  name: string;
  description: string;
  scale: [number, number, number]; // width, height, depth
  color: string; // Hex color code
  isActive: boolean; // Whether the app is currently active/developed
  buildingType: "headquarters" | "skyscraper" | "techcampus" | "datacenter" | "office"; // Type of tech building
  animatedElements?: AnimatedElement[]; // Optional animated elements for the building
}

// Define building interface for internal use
interface Building {
  appDef: AppDefinition;
  meshGroup: THREE.Group;
  particles?: THREE.Points;
  nameplate?: THREE.Mesh;
  windows: THREE.Mesh[];
  position: THREE.Vector3;
}

// Define our applications
const applications: AppDefinition[] = [
  // Main Portal (Headquarters)
  {
    id: "main-portal",
    name: "Main Portal",
    description: "Organization's main landing page",
    scale: [5, 15, 5],
    color: "#0a4d8c",
    isActive: true,
    buildingType: "headquarters"
  },
  // Letter Dispatch (Skyscraper)
  {
    id: "letter-dispatch",
    name: "Letter Dispatch",
    description: "Manage and track all official correspondence",
    scale: [4, 12, 4],
    color: "#2a6ea6",
    isActive: true,
    buildingType: "skyscraper"
  },
  // Work Allocation System (Tech Campus)
  {
    id: "work-allocation",
    name: "Work Allocation System",
    description: "Assign and manage tasks across teams",
    scale: [6, 8, 6],
    color: "#3498db",
    isActive: true,
    buildingType: "techcampus"
  },
  // Cafeteria (Office)
  {
    id: "cafeteria",
    name: "Cafeteria",
    description: "Order food and manage cafeteria services",
    scale: [4, 6, 4],
    color: "#5dade2",
    isActive: true,
    buildingType: "office"
  },
  // IT Solutions (Skyscraper - not yet developed)
  {
    id: "it-solutions",
    name: "IT Solutions",
    description: "Technical support and IT service management",
    scale: [4, 10, 4],
    color: "#1a5276",
    isActive: false,
    buildingType: "skyscraper"
  },
  // HR Portal (Office - not yet developed)
  {
    id: "hr-portal",
    name: "HR Portal",
    description: "Human resources management and services",
    scale: [3, 7, 3],
    color: "#2874a6",
    isActive: false,
    buildingType: "office"
  },
  // Email Portal (Data Center - not yet developed)
  {
    id: "email-portal",
    name: "Email Portal",
    description: "Internal email communication system",
    scale: [5, 5, 5],
    color: "#21618c",
    isActive: false,
    buildingType: "datacenter"
  }
];

// Helper function to convert hex color to THREE.Color number
function hexToThreeColor(hex: string): number {
  // Ensure the hex string starts with #
  const formattedHex = hex.startsWith('#') ? hex : `#${hex}`;
  return parseInt(formattedHex.replace('#', '0x'));
}

export function ThreeJsBackground() {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoveredBuilding, setHoveredBuilding] = useState<AppDefinition | null>(null);
    const mousePosition = useRef(new THREE.Vector2());
    const raycaster = useRef(new THREE.Raycaster());
    const buildings = useRef<Building[]>([]);
    const scene = useRef<THREE.Scene | null>(null);
    const camera = useRef<THREE.PerspectiveCamera | null>(null);
    const renderer = useRef<THREE.WebGLRenderer | null>(null);
    const scrollSpeed = useRef(0);
    const scrollPosition = useRef(0);
    const buildingSpacing = 6; // Space between buildings (smaller to fit more in view)
    const totalWidth = useRef(0);
    const isHoveringLeft = useRef(false);
    const isHoveringRight = useRef(false);
    const clock = useRef(new THREE.Clock());
    const sun = useRef<THREE.DirectionalLight | null>(null);
    const moon = useRef<THREE.DirectionalLight | null>(null);
    const skyColor = useRef<THREE.Color>(new THREE.Color());
    const isNightTime = useRef<boolean>(false);
    const sunPosition = useRef<THREE.Vector3>(new THREE.Vector3());
    const clouds = useRef<THREE.Mesh[]>([]);

    // Track if component is mounted
    const isMounted = useRef(true);

    useEffect(() => {
        if (!containerRef.current) return;

        // Check if it's day or night
        const currentHour = new Date().getHours();
        isNightTime.current = currentHour < 6 || currentHour >= 18;

        // Scene setup
        scene.current = new THREE.Scene();
        
        // Set fog based on time of day
        if (isNightTime.current) {
            scene.current.fog = new THREE.FogExp2(0x0a1525, 0.03);
            skyColor.current.set(0x0a1525);
        } else {
            scene.current.fog = new THREE.FogExp2(0x87ceeb, 0.01);
            skyColor.current.set(0x87ceeb);
        }
        
        // Camera setup - use perspective camera with more orthographic-like settings for 2.5D look
        camera.current = new THREE.PerspectiveCamera(
            30, // Narrower FOV for more orthographic look
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        
        // Position camera to see 3-4 buildings at once
        camera.current.position.set(0, 15, 40);
        camera.current.lookAt(0, 10, 0);

        // Renderer setup
        renderer.current = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        renderer.current.setSize(window.innerWidth, window.innerHeight);
        renderer.current.setClearColor(skyColor.current, 1);
        renderer.current.shadowMap.enabled = true;
        renderer.current.shadowMap.type = THREE.PCFSoftShadowMap;
        
        containerRef.current.appendChild(renderer.current.domElement);

        // Create ground
        createGround();
        
        // Create clouds
        if (!isNightTime.current) {
            createClouds();
        }

        // Add ambient light - different for day and night
        const ambientLight = new THREE.AmbientLight(
            isNightTime.current ? 0x334455 : 0xccccff, 
            isNightTime.current ? 0.2 : 0.4
        );
        if (scene.current) {
            scene.current.add(ambientLight);
        }

        // Add sun or moon directional light
        if (isNightTime.current) {
            // Moon light
            moon.current = new THREE.DirectionalLight(0xaabbff, 0.3);
            moon.current.position.set(5, 10, 7);
            moon.current.castShadow = true;
            setupShadowCamera(moon.current);
            
            if (scene.current) {
                scene.current.add(moon.current);
                
                // Add moon sphere
                const moonGeometry = new THREE.SphereGeometry(1, 16, 16);
                const moonMaterial = new THREE.MeshBasicMaterial({ color: 0xffffee });
                const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
                moonMesh.position.copy(moon.current.position).multiplyScalar(0.8);
                scene.current.add(moonMesh);
                
                // Add stars
                createStars();
            }
        } else {
            // Sun light
            sun.current = new THREE.DirectionalLight(0xffffcc, 0.8);
            sun.current.position.set(5, 10, 7);
            sun.current.castShadow = true;
            setupShadowCamera(sun.current);
            sunPosition.current.copy(sun.current.position);
            
            if (scene.current) {
                scene.current.add(sun.current);
                
                // Add sun sphere
                const sunGeometry = new THREE.SphereGeometry(1.5, 16, 16);
                const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffdd66 });
                const sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
                sunMesh.position.copy(sun.current.position).multiplyScalar(0.8);
                scene.current.add(sunMesh);
            }
        }

        // Add a secondary light for better shadows
        const secondaryLight = new THREE.DirectionalLight(
            isNightTime.current ? 0x223344 : 0x8888ff, 
            isNightTime.current ? 0.1 : 0.3
        );
        secondaryLight.position.set(-5, 8, -10);
        if (scene.current) {
            scene.current.add(secondaryLight);
        }

        // Create buildings from application definitions
        createBuildings();

        // Calculate total width of all buildings with spacing
        totalWidth.current = applications.length * buildingSpacing;

        // Handle mouse move for raycasting and scroll control
        const handleMouseMove = (event: MouseEvent) => {
            // Calculate mouse position in normalized device coordinates
            mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
            mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
            
            // Check if mouse is hovering on the left or right edge for scrolling
            const edgeThreshold = 0.3; // 30% of the screen width on each side
            
            isHoveringLeft.current = mousePosition.current.x < -1 + edgeThreshold;
            isHoveringRight.current = mousePosition.current.x > 1 - edgeThreshold;
            
            // Set scroll speed based on how far into the edge the mouse is
            if (isHoveringLeft.current) {
                const factor = Math.abs((mousePosition.current.x + 1) / edgeThreshold);
                scrollSpeed.current = 0.05 * factor;
            } else if (isHoveringRight.current) {
                const factor = Math.abs((mousePosition.current.x - 1) / -edgeThreshold);
                scrollSpeed.current = -0.05 * factor;
            } else {
                scrollSpeed.current = 0;
            }
        };
        
        window.addEventListener('mousemove', handleMouseMove);

        // Animation loop
        const animate = () => {
            if (!isMounted.current || !scene.current || !camera.current || !renderer.current) return;
            
            requestAnimationFrame(animate);
            
            const delta = clock.current.getDelta();
            const elapsedTime = clock.current.getElapsedTime();
            
            // Update scroll position
            if (scrollSpeed.current !== 0) {
                scrollPosition.current += scrollSpeed.current;
                
                // Ensure scrollPosition stays within bounds for looping
                if (scrollPosition.current > buildingSpacing) {
                    scrollPosition.current -= totalWidth.current;
                } else if (scrollPosition.current < -totalWidth.current + buildingSpacing) {
                    scrollPosition.current += totalWidth.current;
                }
                
                // Update building positions based on scroll
                updateBuildingPositions();
            }
            
            // Animate sun/moon position
            if (!isNightTime.current && sun.current) {
                // Gentle sun movement
                const sunAngle = elapsedTime * 0.05;
                sun.current.position.x = Math.sin(sunAngle) * 15;
                sun.current.position.y = 10 + Math.sin(sunAngle * 0.5) * 2;
                sun.current.position.z = Math.cos(sunAngle) * 15;
            } else if (isNightTime.current && moon.current) {
                // Gentle moon movement
                const moonAngle = elapsedTime * 0.03;
                moon.current.position.x = Math.sin(moonAngle) * 15;
                moon.current.position.y = 10 + Math.sin(moonAngle * 0.5) * 2;
                moon.current.position.z = Math.cos(moonAngle) * 15;
            }
            
            // Animate clouds
            if (!isNightTime.current) {
                animateClouds(delta);
            }
            
            // Animate particles for active buildings
            animateParticles(delta);
            
            // Raycasting for building hover
            raycaster.current.setFromCamera(mousePosition.current, camera.current);
            
            // Get all meshes from all building groups
            const allBuildingMeshes: THREE.Mesh[] = [];
            buildings.current.forEach(building => {
                building.meshGroup.children.forEach(child => {
                    if (child instanceof THREE.Mesh) {
                        allBuildingMeshes.push(child);
                    }
                });
            });
            
            const intersects = raycaster.current.intersectObjects(allBuildingMeshes);
            
            // Reset all buildings
            buildings.current.forEach(building => {
                // Reset building emissive
                building.meshGroup.children.forEach(child => {
                    if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                        child.material.emissive.set(0x000000);
                    }
                });
            });
            
            // Handle hover effect
            if (intersects.length > 0) {
                const hoveredMesh = intersects[0].object as THREE.Mesh;
                
                // Find which building group this mesh belongs to
                const building = buildings.current.find(b => 
                    b.meshGroup.children.includes(hoveredMesh)
                );
                
                if (building) {
                    // Apply hover effect to all meshes in the group
                    building.meshGroup.children.forEach(child => {
                        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                            child.material.emissive.set(0x333333);
                        }
                    });
                    
                    setHoveredBuilding(building.appDef);
                } else {
                    setHoveredBuilding(null);
                }
            } else {
                setHoveredBuilding(null);
            }
            
            // Render scene
            renderer.current.render(scene.current, camera.current);
        };
        
        animate();

        // Handle window resize
        const handleResize = () => {
            if (!camera.current || !renderer.current) return;
            
            camera.current.aspect = window.innerWidth / window.innerHeight;
            camera.current.updateProjectionMatrix();
            renderer.current.setSize(window.innerWidth, window.innerHeight);
        };
        
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            // Set mounted flag to false to stop animations
            isMounted.current = false;
            
            // Remove event listeners
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            
            // Remove renderer from DOM
            if (containerRef.current && renderer.current) {
                try {
                    containerRef.current.removeChild(renderer.current.domElement);
                } catch (e) {
                    console.error("Error removing renderer:", e);
                }
            }
            
            // Dispose resources
            try {
                // Dispose building resources
                buildings.current.forEach(building => {
                    building.meshGroup.children.forEach(child => {
                        if (child instanceof THREE.Mesh) {
                            if (child.geometry) child.geometry.dispose();
                            if (child.material) {
                                if (Array.isArray(child.material)) {
                                    child.material.forEach(m => m.dispose());
                                } else {
                                    child.material.dispose();
                                }
                            }
                        }
                    });
                    
                    // Dispose particle resources
                    if (building.particles) {
                        if (building.particles.geometry) building.particles.geometry.dispose();
                        if (building.particles.material) {
                            if (Array.isArray(building.particles.material)) {
                                building.particles.material.forEach(m => m.dispose());
                            } else {
                                building.particles.material.dispose();
                            }
                        }
                    }
                });
                
                // Clear buildings array
                buildings.current = [];
                
                // Dispose renderer
                if (renderer.current) {
                    renderer.current.dispose();
                    renderer.current = null;
                }
                
                // Clear scene
                if (scene.current) {
                    scene.current = null;
                }
                
                // Clear camera
                camera.current = null;
            } catch (e) {
                console.error("Error during cleanup:", e);
            }
        };
        
        // Function to setup shadow camera for directional lights
        function setupShadowCamera(light: THREE.DirectionalLight) {
            light.shadow.camera.near = 0.1;
            light.shadow.camera.far = 50;
            light.shadow.camera.left = -20;
            light.shadow.camera.right = 20;
            light.shadow.camera.top = 20;
            light.shadow.camera.bottom = -20;
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
        }
        
        // Function to create stars for night sky
        function createStars() {
            if (!scene.current) return;
            
            const starsGeometry = new THREE.BufferGeometry();
            const starsMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 0.1,
            });
            
            const starsCount = 1000;
            const starsPositions = new Float32Array(starsCount * 3);
            
            for (let i = 0; i < starsCount; i++) {
                const i3 = i * 3;
                starsPositions[i3] = (Math.random() - 0.5) * 100;
                starsPositions[i3 + 1] = Math.random() * 50 + 5;
                starsPositions[i3 + 2] = (Math.random() - 0.5) * 100;
            }
            
            starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
            const stars = new THREE.Points(starsGeometry, starsMaterial);
            scene.current.add(stars);
        }
        
        // Function to create clouds
        function createClouds() {
            if (!scene.current) return;
            
            const cloudCount = 15;
            
            for (let i = 0; i < cloudCount; i++) {
                const cloudGroup = new THREE.Group();
                const cloudPuffCount = Math.floor(Math.random() * 5) + 3;
                
                for (let j = 0; j < cloudPuffCount; j++) {
                    const puffSize = Math.random() * 2 + 1;
                    const puffGeometry = new THREE.SphereGeometry(puffSize, 7, 7);
                    const puffMaterial = new THREE.MeshStandardMaterial({
                        color: 0xffffff,
                        transparent: true,
                        opacity: 0.8,
                        roughness: 1,
                        metalness: 0
                    });
                    
                    const puff = new THREE.Mesh(puffGeometry, puffMaterial);
                    puff.position.set(
                        (Math.random() - 0.5) * 4,
                        (Math.random() - 0.5) * 1,
                        (Math.random() - 0.5) * 2
                    );
                    
                    cloudGroup.add(puff);
                }
                
                cloudGroup.position.set(
                    (Math.random() - 0.5) * 80,
                    Math.random() * 10 + 15,
                    (Math.random() - 0.5) * 40
                );
                
                cloudGroup.userData = {
                    speed: Math.random() * 0.5 + 0.2
                };
                
                scene.current.add(cloudGroup);
                clouds.current.push(cloudGroup);
            }
        }
        
        // Function to animate clouds
        function animateClouds(delta: number) {
            clouds.current.forEach(cloud => {
                cloud.position.x += cloud.userData.speed * delta;
                
                // Loop clouds when they go too far
                if (cloud.position.x > 50) {
                    cloud.position.x = -50;
                    cloud.position.z = (Math.random() - 0.5) * 40;
                    cloud.position.y = Math.random() * 10 + 15;
                }
            });
        }
        
        // Function to create ground with city blocks
        function createGround() {
            if (!scene.current) return;
            
            // Main ground
            const groundGeometry = new THREE.PlaneGeometry(400, 400, 32, 32);
            
            // Create ground texture
            const groundTexture = createGroundTexture();
            
            const groundMaterial = new THREE.MeshStandardMaterial({ 
                color: isNightTime.current ? 0x223344 : 0x555555, // Urban color
                roughness: 0.8,
                metalness: 0.2,
                map: groundTexture
            });
            
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.position.y = 0;
            ground.receiveShadow = true;
            scene.current.add(ground);
            
            // Create city grid with roads
            createCityGrid();
            
            // Add main road
            const mainRoadGeometry = new THREE.PlaneGeometry(400, 8);
            const roadMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.9,
                metalness: 0.1,
                map: createRoadTexture()
            });
            
            const mainRoad = new THREE.Mesh(mainRoadGeometry, roadMaterial);
            mainRoad.rotation.x = -Math.PI / 2;
            mainRoad.position.y = 0.01; // Slightly above ground to prevent z-fighting
            mainRoad.position.z = 10; // In front of buildings
            mainRoad.receiveShadow = true;
            scene.current.add(mainRoad);
            
            // Create dummy buildings for city background
            createDummyBuildings();
        }
        
        // Create city grid with roads
        function createCityGrid() {
            if (!scene.current) return;
            
            const gridSize = 400;
            const blockSize = 40;
            const roadWidth = 5;
            
            // Create horizontal roads
            for (let z = -gridSize/2 + blockSize; z < gridSize/2; z += blockSize + roadWidth) {
                if (Math.abs(z - 10) < roadWidth) continue; // Skip where main road is
                
                const roadGeometry = new THREE.PlaneGeometry(gridSize, roadWidth);
                const roadMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.9,
                    metalness: 0.1,
                    map: createRoadTexture()
                });
                
                const road = new THREE.Mesh(roadGeometry, roadMaterial);
                road.rotation.x = -Math.PI / 2;
                road.position.y = 0.01;
                road.position.z = z;
                road.receiveShadow = true;
                scene.current.add(road);
            }
            
            // Create vertical roads
            for (let x = -gridSize/2 + blockSize; x < gridSize/2; x += blockSize + roadWidth) {
                const roadGeometry = new THREE.PlaneGeometry(roadWidth, gridSize);
                const roadMaterial = new THREE.MeshStandardMaterial({
                    color: 0x333333,
                    roughness: 0.9,
                    metalness: 0.1,
                    map: createRoadTexture(true)
                });
                
                const road = new THREE.Mesh(roadGeometry, roadMaterial);
                road.rotation.x = -Math.PI / 2;
                road.position.y = 0.01;
                road.position.x = x;
                road.receiveShadow = true;
                scene.current.add(road);
            }
        }
        
        // Create dummy background buildings
        function createDummyBuildings() {
            if (!scene.current) return;
            
            // Create 50 random buildings in the background
            for (let i = 0; i < 50; i++) {
                // Random position away from main buildings
                const x = (Math.random() - 0.5) * 300;
                const z = (Math.random() - 0.5) * 300;
                
                // Skip if too close to main road
                if (Math.abs(z - 10) < 20 && Math.abs(x) < 50) continue;
                
                // Random building size
                const width = Math.random() * 8 + 3;
                const height = Math.random() * 20 + 5;
                const depth = Math.random() * 8 + 3;
                
                // Random color in blue/gray corporate palette
                const colorHue = 210 + Math.random() * 30; // Blue range
                const colorSat = 20 + Math.random() * 40;  // Medium saturation
                const colorLit = 30 + Math.random() * 40;  // Medium-dark to medium-light
                
                const color = new THREE.Color().setHSL(colorHue/360, colorSat/100, colorLit/100);
                
                // Create building
                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const buildingMaterial = new THREE.MeshStandardMaterial({
                    color: color,
                    roughness: 0.7,
                    metalness: 0.3
                });
                
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                building.position.set(x, height/2, z);
                building.castShadow = true;
                building.receiveShadow = true;
                
                // Add windows
                addBuildingWindows(building, width, height, depth, isNightTime.current);
                
                scene.current.add(building);
            }
        }
        
        // Add windows to dummy buildings
        function addBuildingWindows(building: THREE.Mesh, width: number, height: number, depth: number, isNight: boolean) {
            if (!scene.current) return;
            
            const windowSize = 0.3;
            const windowSpacing = 1;
            const windowRows = Math.floor(height / windowSpacing) - 1;
            const windowColsX = Math.floor(width / windowSpacing) - 1;
            const windowColsZ = Math.floor(depth / windowSpacing) - 1;
            
            // Random chance this building has lit windows
            const hasLitWindows = Math.random() > 0.3;
            
            // Window material
            const windowMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                roughness: 0.2,
                metalness: 0.8,
                transparent: true,
                opacity: 0.7,
                emissive: hasLitWindows ? (isNight ? 0xffffaa : 0x88ccff) : 0x000000,
                emissiveIntensity: hasLitWindows ? (isNight ? 0.5 : 0.2) : 0
            });
            
            // Add windows to front face (random pattern)
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowColsX; col++) {
                    // Skip some windows randomly
                    if (Math.random() > 0.7) continue;
                    
                    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                    
                    const x = (col - (windowColsX - 1) / 2) * windowSpacing;
                    const y = (row + 0.5) * windowSpacing;
                    const z = depth / 2 + 0.01;
                    
                    windowMesh.position.set(x, y, z);
                    building.add(windowMesh);
                }
            }
            
            // Add windows to back face (random pattern)
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowColsX; col++) {
                    // Skip some windows randomly
                    if (Math.random() > 0.7) continue;
                    
                    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                    
                    const x = (col - (windowColsX - 1) / 2) * windowSpacing;
                    const y = (row + 0.5) * windowSpacing;
                    const z = -depth / 2 - 0.01;
                    
                    windowMesh.position.set(x, y, z);
                    windowMesh.rotation.y = Math.PI;
                    building.add(windowMesh);
                }
            }
            
            // Add windows to side faces
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowColsZ; col++) {
                    // Skip some windows randomly
                    if (Math.random() > 0.7) continue;
                    
                    const windowGeometry = new THREE.BoxGeometry(0.1, windowSize, windowSize);
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                    
                    const x = width / 2 + 0.01;
                    const y = (row + 0.5) * windowSpacing;
                    const z = (col - (windowColsZ - 1) / 2) * windowSpacing;
                    
                    windowMesh.position.set(x, y, z);
                    building.add(windowMesh);
                    
                    // Other side
                    const windowMesh2 = new THREE.Mesh(windowGeometry, windowMaterial.clone());
                    windowMesh2.position.set(-width / 2 - 0.01, y, z);
                    windowMesh2.rotation.y = Math.PI;
                    building.add(windowMesh2);
                }
            }
        }
        
        // Function to create a ground texture - minimalist design
        function createGroundTexture(): THREE.Texture {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const context = canvas.getContext('2d');
            
            if (context) {
                // Fill with clean base color
                context.fillStyle = isNightTime.current ? '#1a1a2e' : '#f5f5f7';
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add subtle grid pattern
                const gridSize = 128;
                context.strokeStyle = isNightTime.current ? '#2a2a3e' : '#e5e5e7';
                context.lineWidth = 1;
                
                // Draw subtle grid
                for (let x = 0; x < canvas.width; x += gridSize) {
                    context.beginPath();
                    context.moveTo(x, 0);
                    context.lineTo(x, canvas.height);
                    context.stroke();
                }
                
                for (let y = 0; y < canvas.height; y += gridSize) {
                    context.beginPath();
                    context.moveTo(0, y);
                    context.lineTo(canvas.width, y);
                    context.stroke();
                }
                
                // Add very subtle noise for texture
                for (let i = 0; i < 5000; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 1 + 0.5;
                    
                    if (isNightTime.current) {
                        context.fillStyle = `rgba(50, 50, 80, ${Math.random() * 0.03})`;
                    } else {
                        context.fillStyle = `rgba(220, 220, 230, ${Math.random() * 0.03})`;
                    }
                    context.fillRect(x, y, size, size);
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(10, 10);
            
            return texture;
        }
        
        // Function to create a minimalist path texture
        function createRoadTexture(vertical: boolean = false): THREE.Texture {
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const context = canvas.getContext('2d');
            
            if (context) {
                // Fill with clean base color
                const baseColor = isNightTime.current ? '#2a2a3e' : '#e8e8ea';
                context.fillStyle = baseColor;
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add subtle texture
                for (let i = 0; i < 2000; i++) {
                    const x = Math.random() * canvas.width;
                    const y = Math.random() * canvas.height;
                    const size = Math.random() * 1 + 0.5;
                    
                    if (isNightTime.current) {
                        context.fillStyle = `rgba(60, 60, 90, ${Math.random() * 0.05})`;
                    } else {
                        context.fillStyle = `rgba(200, 200, 210, ${Math.random() * 0.05})`;
                    }
                    context.fillRect(x, y, size, size);
                }
                
                // Add subtle center line
                const lineColor = isNightTime.current ? '#4a4a6e' : '#d0d0d5';
                context.strokeStyle = lineColor;
                context.lineWidth = 1;
                context.setLineDash([]);
                
                if (vertical) {
                    context.beginPath();
                    context.moveTo(canvas.width / 2, 0);
                    context.lineTo(canvas.width / 2, canvas.height);
                    context.stroke();
                } else {
                    context.beginPath();
                    context.moveTo(0, canvas.height / 2);
                    context.lineTo(canvas.width, canvas.height / 2);
                    context.stroke();
                }
                
                // Add subtle edge accents
                const edgeColor = isNightTime.current ? '#3a3a5e' : '#d8d8dd';
                context.strokeStyle = edgeColor;
                context.lineWidth = 1;
                
                if (vertical) {
                    // Left edge accent
                    context.beginPath();
                    context.moveTo(canvas.width * 0.2, 0);
                    context.lineTo(canvas.width * 0.2, canvas.height);
                    context.stroke();
                    
                    // Right edge accent
                    context.beginPath();
                    context.moveTo(canvas.width * 0.8, 0);
                    context.lineTo(canvas.width * 0.8, canvas.height);
                    context.stroke();
                } else {
                    // Top edge accent
                    context.beginPath();
                    context.moveTo(0, canvas.height * 0.2);
                    context.lineTo(canvas.width, canvas.height * 0.2);
                    context.stroke();
                    
                    // Bottom edge accent
                    context.beginPath();
                    context.moveTo(0, canvas.height * 0.8);
                    context.lineTo(canvas.width, canvas.height * 0.8);
                    context.stroke();
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(vertical ? 1 : 10, vertical ? 10 : 1);
            
            return texture;
        }
        
        // Function to create all buildings
        function createBuildings() {
            if (!scene.current) return;
            
            // Create buildings with initial positions
            applications.forEach((app, index) => {
                const position = new THREE.Vector3(
                    index * buildingSpacing, // Initial X position
                    0, // Y position (on the ground)
                    0  // Z position
                );
                
                createBuilding(app, position, index);
            });
            
            // Update positions to center the view
            updateBuildingPositions();
        }
        
        // Function to update building positions based on scroll
        function updateBuildingPositions() {
            buildings.current.forEach((building, index) => {
                const xPos = (index * buildingSpacing) + scrollPosition.current;
                
                // Handle looping by creating the illusion of infinite scrolling
                let adjustedX = xPos;
                
                // If building is too far to the left, move it to the right end
                if (xPos < -buildingSpacing * 2) {
                    adjustedX = xPos + totalWidth.current;
                }
                
                // If building is too far to the right, move it to the left end
                if (xPos > buildingSpacing * (applications.length + 1)) {
                    adjustedX = xPos - totalWidth.current;
                }
                
                building.meshGroup.position.x = adjustedX;
                building.position.x = adjustedX;
                
                // If building has particles, update their position too
                if (building.particles) {
                    building.particles.position.x = adjustedX;
                }
            });
        }
        
        // Function to create a single building
        function createBuilding(app: AppDefinition, position: THREE.Vector3, index: number) {
            if (!scene.current) return;
            
            const group = new THREE.Group();
            group.position.copy(position);
            
            // Base material with different opacity based on active status
            const baseMaterial = new THREE.MeshStandardMaterial({
                color: hexToThreeColor(app.color),
                roughness: 0.7,
                metalness: 0.3,
                transparent: false,
                opacity: 1.0
            });
            
            // Secondary material for details
            const detailMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.8,
                metalness: 0.2,
                transparent: false,
                opacity: 1.0
            });
            
            // Glass material for windows - lit for active apps
            const glassMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                roughness: 0.2,
                metalness: 0.8,
                transparent: true,
                opacity: 0.7,
                emissive: app.isActive ? (isNightTime.current ? 0xffffaa : 0x88ccff) : 0x000000,
                emissiveIntensity: app.isActive ? (isNightTime.current ? 0.5 : 0.2) : 0
            });
            
            // Create different building types
            const windows: THREE.Mesh[] = [];
            
            // Use a single minimalist building style for all types
            createMinimalistModule(group, app, baseMaterial, detailMaterial, glassMaterial, windows);
            
            // Create nameplate with app name
            createNameplate(group, app);
            
            scene.current.add(group);
            
            // Create concrete slab under building
            const slabGeometry = new THREE.BoxGeometry(
                app.scale[0] + 0.5, 
                0.1, 
                app.scale[2] + 0.5
            );
            
            const slabMaterial = new THREE.MeshStandardMaterial({
                color: 0x555555,
                roughness: 0.7,
                metalness: 0.2
            });
            
            const slab = new THREE.Mesh(slabGeometry, slabMaterial);
            slab.position.set(position.x, 0.05, position.z);
            slab.receiveShadow = true;
            if (scene.current) {
                scene.current.add(slab);
            }
            
            // Store reference
            const building: Building = {
                appDef: app,
                meshGroup: group,
                windows,
                position: position.clone()
            };
            
            buildings.current.push(building);
            
            // Add effects for active buildings
            if (app.isActive) {
                addParticles(building);
            }
        }
        
        // Function to create a nameplate with the app name
        function createNameplate(group: THREE.Group, app: AppDefinition) {
            // Create a canvas for the nameplate texture
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 128;
            const context = canvas.getContext('2d');
            
            if (context) {
                // Fill with base color
                context.fillStyle = app.color;
                context.fillRect(0, 0, canvas.width, canvas.height);
                
                // Add border
                context.strokeStyle = '#ffffff';
                context.lineWidth = 4;
                context.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
                
                // Add text
                context.fillStyle = '#ffffff';
                context.font = 'bold 48px Arial';
                context.textAlign = 'center';
                context.textBaseline = 'middle';
                context.fillText(app.name, canvas.width / 2, canvas.height / 2);
                
                // Add "Coming Soon" for inactive apps
                if (!app.isActive) {
                    context.font = 'italic 24px Arial';
                    context.fillText("Coming Soon", canvas.width / 2, canvas.height - 30);
                }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            
            // Create nameplate mesh
            const nameplateGeometry = new THREE.PlaneGeometry(app.scale[0] * 0.8, app.scale[0] * 0.2);
            const nameplateMaterial = new THREE.MeshBasicMaterial({
                map: texture,
                transparent: true,
                opacity: 1.0
            });
            
            const nameplate = new THREE.Mesh(nameplateGeometry, nameplateMaterial);
            nameplate.position.set(0, app.scale[1] + 0.5, 0);
            nameplate.rotation.x = -Math.PI / 6; // Tilt slightly for better visibility
            
            group.add(nameplate);
        }
        
        // Function to create a minimalist module - clean, modern design
        function createMinimalistModule(
            group: THREE.Group, 
            app: AppDefinition, 
            baseMaterial: THREE.Material, 
            detailMaterial: THREE.Material,
            glassMaterial: THREE.Material,
            windows: THREE.Mesh[]
        ) {
            // Create base module - simple rectangular prism
            const baseHeight = app.isActive ? app.scale[1] * 1.2 : app.scale[1];
            const baseGeometry = new THREE.BoxGeometry(app.scale[0], baseHeight, app.scale[2]);
            
            // Create custom material with subtle gradient
            const customMaterial = new THREE.MeshStandardMaterial({
                color: hexToThreeColor(app.color),
                roughness: 0.2,
                metalness: 0.8,
                transparent: false,
                opacity: 1.0
            });
            
            const baseMesh = new THREE.Mesh(baseGeometry, customMaterial);
            baseMesh.position.y = baseHeight / 2;
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            group.add(baseMesh);
            
            // Add subtle accent line
            const accentHeight = 0.05;
            const accentGeometry = new THREE.BoxGeometry(app.scale[0] + 0.1, accentHeight, app.scale[2] + 0.1);
            const accentMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.1,
                metalness: 0.9,
                transparent: true,
                opacity: 0.3
            });
            
            const accentMesh = new THREE.Mesh(accentGeometry, accentMaterial);
            accentMesh.position.y = baseHeight * 0.7;
            group.add(accentMesh);
            
            // Add glass panel on front
            const panelWidth = app.scale[0] * 0.8;
            const panelHeight = baseHeight * 0.6;
            const panelGeometry = new THREE.PlaneGeometry(panelWidth, panelHeight);
            
            const panelMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.05,
                metalness: 0.95,
                transparent: true,
                opacity: 0.15,
                emissive: app.isActive ? (isNightTime.current ? 0xffffee : 0xffffff) : 0x000000,
                emissiveIntensity: app.isActive ? (isNightTime.current ? 0.2 : 0.1) : 0
            });
            
            // Front panel
            const frontPanel = new THREE.Mesh(panelGeometry, panelMaterial);
            frontPanel.position.set(0, baseHeight * 0.5, app.scale[2] / 2 + 0.01);
            group.add(frontPanel);
            windows.push(frontPanel);
            
            // Back panel
            const backPanel = new THREE.Mesh(panelGeometry, panelMaterial.clone());
            backPanel.position.set(0, baseHeight * 0.5, -app.scale[2] / 2 - 0.01);
            backPanel.rotation.y = Math.PI;
            group.add(backPanel);
            windows.push(backPanel);
            
            // Add interactive elements if app is active
            if (app.isActive) {
                // Add pulsing light on top
                const lightGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.1, 16);
                const lightMaterial = new THREE.MeshStandardMaterial({
                    color: hexToThreeColor(app.color),
                    emissive: hexToThreeColor(app.color),
                    emissiveIntensity: 0.8,
                    transparent: true,
                    opacity: 0.9
                });
                
                const lightMesh = new THREE.Mesh(lightGeometry, lightMaterial);
                lightMesh.position.y = baseHeight + 0.05;
                group.add(lightMesh);
                
                // Store reference for animation
                app.animatedElements = app.animatedElements || [];
                app.animatedElements.push({
                    mesh: lightMesh,
                    type: 'pulse',
                    phase: Math.random() * Math.PI * 2
                });
                
                // Add floating ring
                const ringGeometry = new THREE.TorusGeometry(0.3, 0.03, 16, 32);
                const ringMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: hexToThreeColor(app.color),
                    emissiveIntensity: 0.5,
                    transparent: true,
                    opacity: 0.7
                });
                
                const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
                ringMesh.position.y = baseHeight + 0.4;
                ringMesh.rotation.x = Math.PI / 2;
                group.add(ringMesh);
                
                // Store reference for animation
                app.animatedElements.push({
                    mesh: ringMesh,
                    type: 'float',
                    phase: Math.random() * Math.PI * 2
                });
            }
            
            // Add subtle base
            const baseAccentGeometry = new THREE.BoxGeometry(app.scale[0] + 0.2, 0.05, app.scale[2] + 0.2);
            const baseAccentMaterial = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                roughness: 0.1,
                metalness: 0.9,
                transparent: true,
                opacity: 0.2
            });
            
            const baseAccentMesh = new THREE.Mesh(baseAccentGeometry, baseAccentMaterial);
            baseAccentMesh.position.y = 0.025;
            group.add(baseAccentMesh);
        }
        
        // Function to create skyscraper building - modern glass tower
        function createSkyscraperBuilding(
            group: THREE.Group, 
            app: AppDefinition, 
            baseMaterial: THREE.Material, 
            detailMaterial: THREE.Material,
            glassMaterial: THREE.Material,
            windows: THREE.Mesh[]
        ) {
            // Base structure
            const baseGeometry = new THREE.BoxGeometry(app.scale[0], app.scale[1] * 0.1, app.scale[2]);
            const baseMesh = new THREE.Mesh(baseGeometry, detailMaterial);
            baseMesh.position.y = app.scale[1] * 0.05;
            baseMesh.castShadow = true;
            baseMesh.receiveShadow = true;
            group.add(baseMesh);
            
            // Main tower - slightly twisted design
            const segments = 8; // Number of segments for the twisted tower
            const twistAngle = Math.PI * 0.1; // Total twist angle
            
            for (let i = 0; i < segments; i++) {
                const segmentHeight = app.scale[1] * 0.9 / segments;
                const segmentY = app.scale[1] * 0.1 + i * segmentHeight + segmentHeight / 2;
                const rotationY = (i / segments) * twistAngle;
                
                const segmentGeometry = new THREE.BoxGeometry(
                    app.scale[0] * (1 - i * 0.05 / segments), // Slightly taper as we go up
                    segmentHeight * 0.95, // Slight gap between segments
                    app.scale[2] * (1 - i * 0.05 / segments)  // Slightly taper as we go up
                );
                
                const segmentMesh = new THREE.Mesh(segmentGeometry, baseMaterial);
                segmentMesh.position.y = segmentY;
                segmentMesh.rotation.y = rotationY;
                segmentMesh.castShadow = true;
                segmentMesh.receiveShadow = true;
                group.add(segmentMesh);
                
                // Add glass curtain walls to each segment
                const wallWidth = app.scale[0] * (1 - i * 0.05 / segments) * 0.95;
                const wallHeight = segmentHeight * 0.9;
                
                // Create glass panels for each side
                for (let side = 0; side < 4; side++) {
                    const wallGeometry = new THREE.PlaneGeometry(
                        side % 2 === 0 ? wallWidth : app.scale[2] * (1 - i * 0.05 / segments) * 0.95,
                        wallHeight
                    );
                    
                    const wallMaterial = new THREE.MeshStandardMaterial({
                        color: 0x88ccff,
                        roughness: 0.1,
                        metalness: 0.9,
                        transparent: true,
                        opacity: 0.7,
                        emissive: app.isActive ? (isNightTime.current ? 0xffffaa : 0x88ccff) : 0x000000,
                        emissiveIntensity: app.isActive ? (isNightTime.current ? 0.3 : 0.1) : 0
                    });
                    
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.y = segmentY;
                    wall.rotation.y = rotationY + side * Math.PI / 2;
                    
                    // Position the wall on the face of the segment
                    const offset = side % 2 === 0 ? app.scale[0] : app.scale[2];
                    const offsetFactor = (1 - i * 0.05 / segments) / 2;
                    
                    if (side === 0) wall.position.z = offset * offsetFactor + 0.01;
                    else if (side === 1) wall.position.x = offset * offsetFactor + 0.01;
                    else if (side === 2) wall.position.z = -offset * offsetFactor - 0.01;
                    else wall.position.x = -offset * offsetFactor - 0.01;
                    
                    group.add(wall);
                    windows.push(wall);
                }
            }
            
            // Roof structure
            const roofGeometry = new THREE.BoxGeometry(app.scale[0] * 0.5, app.scale[1] * 0.05, app.scale[2] * 0.5);
            const roofMesh = new THREE.Mesh(roofGeometry, detailMaterial);
            roofMesh.position.y = app.scale[1] * 1.025;
            roofMesh.castShadow = true;
            group.add(roofMesh);
            
            // Antenna/spire
            const spireGeometry = new THREE.CylinderGeometry(0.05, 0.2, app.scale[1] * 0.2, 8);
            const spireMesh = new THREE.Mesh(spireGeometry, detailMaterial);
            spireMesh.position.y = app.scale[1] * 1.15;
            spireMesh.castShadow = true;
            group.add(spireMesh);
            
            // Antenna top light
            const antennaLightGeometry = new THREE.SphereGeometry(0.1, 16, 16);
            const antennaLightMaterial = new THREE.MeshStandardMaterial({
                color: 0xff0000,
                emissive: 0xff0000,
                emissiveIntensity: 0.5
            });
            const antennaLightMesh = new THREE.Mesh(antennaLightGeometry, antennaLightMaterial);
            antennaLightMesh.position.y = app.scale[1] * 1.25;
            group.add(antennaLightMesh);
            
            // Entrance
            const entranceWidth = 2;
            const entranceHeight = 1.5;
            const entranceDepth = 0.8;
            
            const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
            const entranceMesh = new THREE.Mesh(entranceGeometry, detailMaterial);
            entranceMesh.position.set(0, entranceHeight / 2, app.scale[2] / 2 + entranceDepth / 2);
            entranceMesh.castShadow = true;
            entranceMesh.receiveShadow = true;
            group.add(entranceMesh);
            
            // Entrance door
            const doorGeometry = new THREE.BoxGeometry(entranceWidth * 0.7, entranceHeight * 0.8, 0.1);
            const doorMaterial = glassMaterial.clone();
            doorMaterial.opacity = 0.8;
            const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
            doorMesh.position.set(0, entranceHeight * 0.4, app.scale[2] / 2 + entranceDepth + 0.01);
            group.add(doorMesh);
            windows.push(doorMesh);
        }
        
        // Function to create tech campus building - modern low-rise tech company campus
        function createTechCampusBuilding(
            group: THREE.Group, 
            app: AppDefinition, 
            baseMaterial: THREE.Material, 
            detailMaterial: THREE.Material,
            glassMaterial: THREE.Material,
            windows: THREE.Mesh[]
        ) {
            // Create multiple connected buildings for a campus feel
            
            // Main building (central)
            const mainGeometry = new THREE.BoxGeometry(app.scale[0] * 0.6, app.scale[1] * 0.6, app.scale[2] * 0.6);
            const mainMesh = new THREE.Mesh(mainGeometry, baseMaterial);
            mainMesh.position.y = app.scale[1] * 0.3;
            mainMesh.castShadow = true;
            mainMesh.receiveShadow = true;
            group.add(mainMesh);
            
            // Secondary building 1 (left wing)
            const leftWingGeometry = new THREE.BoxGeometry(app.scale[0] * 0.4, app.scale[1] * 0.4, app.scale[2] * 0.4);
            const leftWingMesh = new THREE.Mesh(leftWingGeometry, baseMaterial);
            leftWingMesh.position.set(-app.scale[0] * 0.5, app.scale[1] * 0.2, -app.scale[2] * 0.1);
            leftWingMesh.castShadow = true;
            leftWingMesh.receiveShadow = true;
            group.add(leftWingMesh);
            
            // Secondary building 2 (right wing)
            const rightWingGeometry = new THREE.BoxGeometry(app.scale[0] * 0.4, app.scale[1] * 0.5, app.scale[2] * 0.4);
            const rightWingMesh = new THREE.Mesh(rightWingGeometry, baseMaterial);
            rightWingMesh.position.set(app.scale[0] * 0.5, app.scale[1] * 0.25, -app.scale[2] * 0.1);
            rightWingMesh.castShadow = true;
            rightWingMesh.receiveShadow = true;
            group.add(rightWingMesh);
            
            // Connecting walkway 1 (to left wing)
            const walkway1Geometry = new THREE.BoxGeometry(app.scale[0] * 0.2, app.scale[1] * 0.1, app.scale[2] * 0.1);
            const walkway1Mesh = new THREE.Mesh(walkway1Geometry, glassMaterial);
            walkway1Mesh.position.set(-app.scale[0] * 0.25, app.scale[1] * 0.2, -app.scale[2] * 0.1);
            walkway1Mesh.castShadow = true;
            walkway1Mesh.receiveShadow = true;
            group.add(walkway1Mesh);
            
            // Connecting walkway 2 (to right wing)
            const walkway2Geometry = new THREE.BoxGeometry(app.scale[0] * 0.2, app.scale[1] * 0.1, app.scale[2] * 0.1);
            const walkway2Mesh = new THREE.Mesh(walkway2Geometry, glassMaterial);
            walkway2Mesh.position.set(app.scale[0] * 0.25, app.scale[1] * 0.2, -app.scale[2] * 0.1);
            walkway2Mesh.castShadow = true;
            walkway2Mesh.receiveShadow = true;
            group.add(walkway2Mesh);
            
            // Glass facades for main building
            const facadeGeometry = new THREE.PlaneGeometry(app.scale[0] * 0.55, app.scale[1] * 0.55);
            const facadeMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                roughness: 0.1,
                metalness: 0.9,
                transparent: true,
                opacity: 0.7,
                emissive: app.isActive ? (isNightTime.current ? 0xffffaa : 0x88ccff) : 0x000000,
                emissiveIntensity: app.isActive ? (isNightTime.current ? 0.3 : 0.1) : 0
            });
            
            // Front facade
            const frontFacade = new THREE.Mesh(facadeGeometry, facadeMaterial);
            frontFacade.position.set(0, app.scale[1] * 0.3, app.scale[2] * 0.3 + 0.01);
            group.add(frontFacade);
            windows.push(frontFacade);
            
            // Back facade
            const backFacade = new THREE.Mesh(facadeGeometry, facadeMaterial);
            backFacade.position.set(0, app.scale[1] * 0.3, -app.scale[2] * 0.3 - 0.01);
            backFacade.rotation.y = Math.PI;
            group.add(backFacade);
            windows.push(backFacade);
            
            // Left facade
            const leftFacade = new THREE.Mesh(
                new THREE.PlaneGeometry(app.scale[2] * 0.55, app.scale[1] * 0.55),
                facadeMaterial.clone()
            );
            leftFacade.position.set(-app.scale[0] * 0.3 - 0.01, app.scale[1] * 0.3, 0);
            leftFacade.rotation.y = -Math.PI / 2;
            group.add(leftFacade);
            windows.push(leftFacade);
            
            // Right facade
            const rightFacade = new THREE.Mesh(
                new THREE.PlaneGeometry(app.scale[2] * 0.55, app.scale[1] * 0.55),
                facadeMaterial.clone()
            );
            rightFacade.position.set(app.scale[0] * 0.3 + 0.01, app.scale[1] * 0.3, 0);
            rightFacade.rotation.y = Math.PI / 2;
            group.add(rightFacade);
            windows.push(rightFacade);
            
            // Roof features - solar panels
            const panelRows = 3;
            const panelCols = 4;
            const panelSize = app.scale[0] * 0.1;
            const panelSpacing = panelSize * 1.2;
            
            for (let row = 0; row < panelRows; row++) {
                for (let col = 0; col < panelCols; col++) {
                    const panelGeometry = new THREE.BoxGeometry(panelSize, 0.05, panelSize);
                    const panelMaterial = new THREE.MeshStandardMaterial({
                        color: 0x111122,
                        roughness: 0.5,
                        metalness: 0.8,
                        emissive: app.isActive && !isNightTime.current ? 0x0000ff : 0x000000,
                        emissiveIntensity: 0.2
                    });
                    
                    const panel = new THREE.Mesh(panelGeometry, panelMaterial);
                    const x = ((col - (panelCols - 1) / 2) * panelSpacing) * 0.8;
                    const z = ((row - (panelRows - 1) / 2) * panelSpacing) * 0.8;
                    panel.position.set(x, app.scale[1] * 0.6 + 0.025, z);
                    panel.rotation.x = -Math.PI / 12; // Slight tilt for solar panels
                    panel.castShadow = true;
                    group.add(panel);
                }
            }
            
            // Main entrance
            const entranceWidth = 2;
            const entranceHeight = 1.5;
            const entranceDepth = 0.5;
            
            const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
            const entranceMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.7,
                metalness: 0.5
            });
            const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
            entranceMesh.position.set(0, entranceHeight / 2, app.scale[2] * 0.3 + entranceDepth / 2);
            entranceMesh.castShadow = true;
            entranceMesh.receiveShadow = true;
            group.add(entranceMesh);
            
            // Entrance doors (glass)
            const doorGeometry = new THREE.BoxGeometry(entranceWidth * 0.8, entranceHeight * 0.8, 0.1);
            const doorMaterial = glassMaterial.clone();
            doorMaterial.opacity = 0.8;
            const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
            doorMesh.position.set(0, entranceHeight * 0.4, app.scale[2] * 0.3 + entranceDepth + 0.01);
            group.add(doorMesh);
            windows.push(doorMesh);
            
            // Company logo on top
            const logoGeometry = new THREE.BoxGeometry(app.scale[0] * 0.2, app.scale[1] * 0.1, 0.1);
            const logoMaterial = new THREE.MeshStandardMaterial({
                color: hexToThreeColor(app.color),
                emissive: hexToThreeColor(app.color),
                emissiveIntensity: 0.5
            });
            const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
            logoMesh.position.set(0, app.scale[1] * 0.65, app.scale[2] * 0.3 + 0.1);
            group.add(logoMesh);
        }
        
        // Function to create data center building - modern server facility
        function createDataCenterBuilding(
            group: THREE.Group, 
            app: AppDefinition, 
            baseMaterial: THREE.Material, 
            detailMaterial: THREE.Material,
            glassMaterial: THREE.Material,
            windows: THREE.Mesh[]
        ) {
            // Main building - low, wide structure
            const mainGeometry = new THREE.BoxGeometry(app.scale[0], app.scale[1] * 0.5, app.scale[2]);
            const mainMesh = new THREE.Mesh(mainGeometry, baseMaterial);
            mainMesh.position.y = app.scale[1] * 0.25;
            mainMesh.castShadow = true;
            mainMesh.receiveShadow = true;
            group.add(mainMesh);
            
            // Cooling units on roof
            const coolingUnitCount = 6;
            const coolingUnitSize = app.scale[0] * 0.15;
            const coolingUnitSpacing = app.scale[0] * 0.8 / (coolingUnitCount - 1);
            
            for (let i = 0; i < coolingUnitCount; i++) {
                const unitGeometry = new THREE.BoxGeometry(coolingUnitSize, app.scale[1] * 0.15, coolingUnitSize);
                const unitMesh = new THREE.Mesh(unitGeometry, detailMaterial);
                
                const x = (i - (coolingUnitCount - 1) / 2) * coolingUnitSpacing;
                unitMesh.position.set(x, app.scale[1] * 0.5 + app.scale[1] * 0.075, 0);
                unitMesh.castShadow = true;
                unitMesh.receiveShadow = true;
                group.add(unitMesh);
                
                // Add cooling fans on top
                const fanGeometry = new THREE.CylinderGeometry(coolingUnitSize * 0.3, coolingUnitSize * 0.3, 0.1, 16);
                const fanMaterial = new THREE.MeshStandardMaterial({
                    color: 0x444444,
                    roughness: 0.8,
                    metalness: 0.5
                });
                const fanMesh = new THREE.Mesh(fanGeometry, fanMaterial);
                fanMesh.rotation.x = Math.PI / 2;
                fanMesh.position.set(x, app.scale[1] * 0.5 + app.scale[1] * 0.15 + 0.05, 0);
                group.add(fanMesh);
                
                // Add fan blades (if active)
                if (app.isActive) {
                    const bladeGeometry = new THREE.BoxGeometry(coolingUnitSize * 0.5, 0.02, coolingUnitSize * 0.1);
                    const bladeMaterial = new THREE.MeshStandardMaterial({
                        color: 0x888888,
                        roughness: 0.5,
                        metalness: 0.8
                    });
                    
                    for (let j = 0; j < 4; j++) {
                        const blade = new THREE.Mesh(bladeGeometry, bladeMaterial);
                        blade.position.copy(fanMesh.position);
                        blade.rotation.set(Math.PI / 2, j * Math.PI / 2, 0);
                        group.add(blade);
                    }
                }
            }
            
            // Security entrance - reinforced
            const entranceWidth = 2;
            const entranceHeight = 1.5;
            const entranceDepth = 1;
            
            const entranceGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight, entranceDepth);
            const entranceMaterial = new THREE.MeshStandardMaterial({
                color: 0x333333,
                roughness: 0.7,
                metalness: 0.5
            });
            const entranceMesh = new THREE.Mesh(entranceGeometry, entranceMaterial);
            entranceMesh.position.set(0, entranceHeight / 2, app.scale[2] / 2 + entranceDepth / 2);
            entranceMesh.castShadow = true;
            entranceMesh.receiveShadow = true;
            group.add(entranceMesh);
            
            // Security door - reinforced with small window
            const doorGeometry = new THREE.BoxGeometry(entranceWidth * 0.7, entranceHeight * 0.8, 0.2);
            const doorMaterial = new THREE.MeshStandardMaterial({
                color: 0x444444,
                roughness: 0.6,
                metalness: 0.7
            });
            const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
            doorMesh.position.set(0, entranceHeight * 0.4, app.scale[2] / 2 + entranceDepth + 0.1);
            group.add(doorMesh);
            
            // Small security window in door
            const securityWindowGeometry = new THREE.BoxGeometry(entranceWidth * 0.2, entranceHeight * 0.2, 0.1);
            const securityWindowMaterial = glassMaterial.clone();
            securityWindowMaterial.opacity = 0.7;
            const securityWindowMesh = new THREE.Mesh(securityWindowGeometry, securityWindowMaterial);
            securityWindowMesh.position.set(0, entranceHeight * 0.5, app.scale[2] / 2 + entranceDepth + 0.21);
            group.add(securityWindowMesh);
            windows.push(securityWindowMesh);
            
            // Few small windows (data centers have minimal windows for security)
            const windowSize = 0.3;
            const windowRows = 1;
            const windowCols = 3;
            const windowSpacing = app.scale[0] * 0.25;
            
            // Front windows - minimal for security
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    const windowGeometry = new THREE.BoxGeometry(windowSize, windowSize, 0.1);
                    const windowMaterial = glassMaterial.clone();
                    windowMaterial.opacity = 0.5; // Darker windows for security
                    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial);
                    
                    const x = (col - (windowCols - 1) / 2) * windowSpacing;
                    const y = app.scale[1] * 0.35;
                    const z = app.scale[2] / 2 + 0.01;
                    
                    windowMesh.position.set(x, y, z);
                    group.add(windowMesh);
                    windows.push(windowMesh);
                }
            }
            
            // Server status lights (if active)
            if (app.isActive) {
                const lightCount = 8;
                const lightSpacing = app.scale[0] * 0.8 / (lightCount - 1);
                
                for (let i = 0; i < lightCount; i++) {
                    const lightGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.05);
                    const lightMaterial = new THREE.MeshStandardMaterial({
                        color: i % 3 === 0 ? 0xff0000 : (i % 3 === 1 ? 0x00ff00 : 0x0000ff),
                        emissive: i % 3 === 0 ? 0xff0000 : (i % 3 === 1 ? 0x00ff00 : 0x0000ff),
                        emissiveIntensity: 0.8
                    });
                    
                    const light = new THREE.Mesh(lightGeometry, lightMaterial);
                    const x = (i - (lightCount - 1) / 2) * lightSpacing;
                    light.position.set(x, app.scale[1] * 0.1, app.scale[2] / 2 + 0.03);
                    group.add(light);
                }
            }
            
            // Communication antennas
            const antennaCount = 3;
            const antennaSpacing = app.scale[0] * 0.4 / (antennaCount - 1);
            
            for (let i = 0; i < antennaCount; i++) {
                const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, app.scale[1] * 0.3, 8);
                const antennaMesh = new THREE.Mesh(antennaGeometry, detailMaterial);
                
                const x = (i - (antennaCount - 1) / 2) * antennaSpacing;
                antennaMesh.position.set(x, app.scale[1] * 0.5 + app.scale[1] * 0.15, -app.scale[2] * 0.3);
                group.add(antennaMesh);
                
                // Antenna dish
                const dishGeometry = new THREE.SphereGeometry(0.15, 8, 8, 0, Math.PI);
                const dishMesh = new THREE.Mesh(dishGeometry, detailMaterial);
                dishMesh.rotation.x = Math.PI / 2;
                dishMesh.position.set(x, app.scale[1] * 0.5 + app.scale[1] * 0.3, -app.scale[2] * 0.3);
                group.add(dishMesh);
            }
            
            // Perimeter security fence indicators
            const fencePostCount = 8;
            const fencePostSpacing = Math.PI * 2 / fencePostCount;
            const fenceRadius = Math.max(app.scale[0], app.scale[2]) * 0.7;
            
            for (let i = 0; i < fencePostCount; i++) {
                const angle = i * fencePostSpacing;
                const x = Math.sin(angle) * fenceRadius;
                const z = Math.cos(angle) * fenceRadius;
                
                const postGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
                const postMesh = new THREE.Mesh(postGeometry, detailMaterial);
                postMesh.position.set(x, 0.15, z);
                group.add(postMesh);
            }
        }
        
        // Function to create office building - modern corporate office tower
        function createOfficeBuilding(
            group: THREE.Group, 
            app: AppDefinition, 
            baseMaterial: THREE.Material, 
            detailMaterial: THREE.Material,
            glassMaterial: THREE.Material,
            windows: THREE.Mesh[]
        ) {
            // Create a modern office building with glass curtain walls
            
            // Main structure - slightly tapered
            const mainGeometry = new THREE.BoxGeometry(app.scale[0], app.scale[1], app.scale[2]);
            const mainMesh = new THREE.Mesh(mainGeometry, baseMaterial);
            mainMesh.position.y = app.scale[1] / 2;
            mainMesh.castShadow = true;
            mainMesh.receiveShadow = true;
            group.add(mainMesh);
            
            // Glass curtain walls
            const wallMaterial = new THREE.MeshStandardMaterial({
                color: 0x88ccff,
                roughness: 0.1,
                metalness: 0.9,
                transparent: true,
                opacity: 0.7,
                emissive: app.isActive ? (isNightTime.current ? 0xffffaa : 0x88ccff) : 0x000000,
                emissiveIntensity: app.isActive ? (isNightTime.current ? 0.3 : 0.1) : 0
            });
            
            // Front glass wall
            const frontWallGeometry = new THREE.PlaneGeometry(app.scale[0] * 0.9, app.scale[1] * 0.9);
            const frontWall = new THREE.Mesh(frontWallGeometry, wallMaterial);
            frontWall.position.set(0, app.scale[1] / 2, app.scale[2] / 2 + 0.01);
            group.add(frontWall);
            windows.push(frontWall);
            
            // Back glass wall
            const backWall = new THREE.Mesh(frontWallGeometry, wallMaterial.clone());
            backWall.position.set(0, app.scale[1] / 2, -app.scale[2] / 2 - 0.01);
            backWall.rotation.y = Math.PI;
            group.add(backWall);
            windows.push(backWall);
            
            // Side glass walls
            const sideWallGeometry = new THREE.PlaneGeometry(app.scale[2] * 0.9, app.scale[1] * 0.9);
            
            // Left side
            const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial.clone());
            leftWall.position.set(-app.scale[0] / 2 - 0.01, app.scale[1] / 2, 0);
            leftWall.rotation.y = -Math.PI / 2;
            group.add(leftWall);
            windows.push(leftWall);
            
            // Right side
            const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial.clone());
            rightWall.position.set(app.scale[0] / 2 + 0.01, app.scale[1] / 2, 0);
            rightWall.rotation.y = Math.PI / 2;
            group.add(rightWall);
            windows.push(rightWall);
            
            // Add horizontal dividers for floors
            const floorCount = Math.floor(app.scale[1] / 1.2);
            const floorHeight = app.scale[1] / floorCount;
            
            for (let i = 1; i < floorCount; i++) {
                const dividerGeometry = new THREE.BoxGeometry(app.scale[0] + 0.02, 0.1, app.scale[2] + 0.02);
                const dividerMesh = new THREE.Mesh(dividerGeometry, detailMaterial);
                dividerMesh.position.y = i * floorHeight;
                group.add(dividerMesh);
            }
            
            // Roof features
            const roofBaseGeometry = new THREE.BoxGeometry(app.scale[0], 0.2, app.scale[2]);
            const roofBaseMesh = new THREE.Mesh(roofBaseGeometry, detailMaterial);
            roofBaseMesh.position.y = app.scale[1] + 0.1;
            roofBaseMesh.castShadow = true;
            group.add(roofBaseMesh);
            
            // Roof structure - mechanical room
            const mechanicalRoomGeometry = new THREE.BoxGeometry(app.scale[0] * 0.5, app.scale[1] * 0.1, app.scale[2] * 0.5);
            const mechanicalRoomMesh = new THREE.Mesh(mechanicalRoomGeometry, detailMaterial);
            mechanicalRoomMesh.position.y = app.scale[1] + 0.2 + app.scale[1] * 0.05;
            mechanicalRoomMesh.castShadow = true;
            group.add(mechanicalRoomMesh);
            
            // Roof antennas
            const antennaCount = 3;
            const antennaSpacing = app.scale[0] * 0.3;
            
            for (let i = 0; i < antennaCount; i++) {
                const antennaGeometry = new THREE.CylinderGeometry(0.03, 0.03, app.scale[1] * 0.2, 8);
                const antennaMesh = new THREE.Mesh(antennaGeometry, detailMaterial);
                
                const x = (i - (antennaCount - 1) / 2) * antennaSpacing;
                antennaMesh.position.set(x, app.scale[1] + 0.2 + app.scale[1] * 0.1 + app.scale[1] * 0.1, 0);
                group.add(antennaMesh);
            }
            
            // Grand entrance
            const entranceWidth = 2;
            const entranceHeight = 1.8;
            const entranceDepth = 0.8;
            
            // Entrance canopy
            const canopyGeometry = new THREE.BoxGeometry(entranceWidth * 1.5, 0.1, entranceDepth * 2);
            const canopyMesh = new THREE.Mesh(canopyGeometry, detailMaterial);
            canopyMesh.position.set(0, entranceHeight + 0.05, app.scale[2] / 2 + entranceDepth);
            canopyMesh.castShadow = true;
            group.add(canopyMesh);
            
            // Entrance supports
            const supportGeometry = new THREE.CylinderGeometry(0.1, 0.1, entranceHeight, 8);
            const leftSupport = new THREE.Mesh(supportGeometry, detailMaterial);
            leftSupport.position.set(-entranceWidth * 0.7, entranceHeight / 2, app.scale[2] / 2 + entranceDepth * 1.5);
            group.add(leftSupport);
            
            const rightSupport = new THREE.Mesh(supportGeometry, detailMaterial);
            rightSupport.position.set(entranceWidth * 0.7, entranceHeight / 2, app.scale[2] / 2 + entranceDepth * 1.5);
            group.add(rightSupport);
            
            // Entrance doors (glass)
            const doorGeometry = new THREE.BoxGeometry(entranceWidth, entranceHeight * 0.9, 0.1);
            const doorMaterial = glassMaterial.clone();
            doorMaterial.opacity = 0.8;
            const doorMesh = new THREE.Mesh(doorGeometry, doorMaterial);
            doorMesh.position.set(0, entranceHeight * 0.45, app.scale[2] / 2 + 0.05);
            group.add(doorMesh);
            windows.push(doorMesh);
            
            // Company logo above entrance
            const logoGeometry = new THREE.BoxGeometry(entranceWidth * 0.8, entranceHeight * 0.2, 0.1);
            const logoMaterial = new THREE.MeshStandardMaterial({
                color: hexToThreeColor(app.color),
                emissive: hexToThreeColor(app.color),
                emissiveIntensity: 0.5
            });
            const logoMesh = new THREE.Mesh(logoGeometry, logoMaterial);
            logoMesh.position.set(0, entranceHeight * 1.2, app.scale[2] / 2 + 0.06);
            group.add(logoMesh);
        }
        
        // Function to add particles to active buildings
        function addParticles(building: Building) {
            if (!scene.current) return;
            
            const app = building.appDef;
            
            const particlesCount = 30;
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesMaterial = new THREE.PointsMaterial({
                color: hexToThreeColor(app.color),
                size: 0.08,
                transparent: true,
                opacity: 0.7
            });
            
            // Create positions for particles
            const positions = new Float32Array(particlesCount * 3);
            
            for (let i = 0; i < particlesCount; i++) {
                const i3 = i * 3;
                const radius = Math.max(app.scale[0], app.scale[2]) * 0.7;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.random() * Math.PI;
                
                positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
                positions[i3 + 1] = Math.random() * app.scale[1];
                positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
            }
            
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const particles = new THREE.Points(particlesGeometry, particlesMaterial);
            particles.position.copy(building.position);
            scene.current.add(particles);
            
            // Store reference
            building.particles = particles;
        }
        
        // Function to animate particles and other animated elements
        function animateParticles(delta: number) {
            buildings.current.forEach(building => {
                if (building.appDef.isActive) {
                    // Animate particles if they exist
                    if (building.particles) {
                        const positions = building.particles.geometry.attributes.position.array as Float32Array;
                        const particlesCount = positions.length / 3;
                        
                        for (let i = 0; i < particlesCount; i++) {
                            const i3 = i * 3;
                            
                            // Move particles upward
                            positions[i3 + 1] += 0.01;
                            
                            // Add some gentle swirling motion
                            const angle = Date.now() * 0.001 + i;
                            positions[i3] += Math.sin(angle) * 0.002;
                            positions[i3 + 2] += Math.cos(angle) * 0.002;
                            
                            // Reset particle when it goes too high
                            if (positions[i3 + 1] > building.appDef.scale[1] + 1) {
                                positions[i3 + 1] = 0;
                            }
                        }
                        
                        building.particles.geometry.attributes.position.needsUpdate = true;
                    }
                    
                    // Animate custom elements
                    if (building.appDef.animatedElements) {
                        building.appDef.animatedElements.forEach(element => {
                            if (element.type === 'pulse') {
                                // Pulsing animation
                                const material = element.mesh.material as THREE.MeshStandardMaterial;
                                const time = Date.now() * 0.001;
                                const pulse = Math.sin(time + element.phase) * 0.3 + 0.7;
                                
                                material.emissiveIntensity = pulse;
                                material.opacity = 0.7 + pulse * 0.3;
                            } 
                            else if (element.type === 'float') {
                                // Floating animation
                                const time = Date.now() * 0.001;
                                const floatHeight = Math.sin(time * 0.8 + element.phase) * 0.1;
                                const rotationSpeed = 0.3;
                                
                                // Calculate target position based on building height
                                const targetY = building.appDef.scale[1] * 1.2 + 0.4 + floatHeight;
                                
                                // Smoothly move toward target
                                element.mesh.position.y += (targetY - element.mesh.position.y) * 0.05;
                                element.mesh.rotation.y += rotationSpeed * 0.01;
                            }
                        });
                    }
                    
                    // Animate windows with subtle pulsing
                    building.windows.forEach(window => {
                        const material = window.material as THREE.MeshStandardMaterial;
                        if (material.emissiveIntensity !== undefined) {
                            // Subtle pulsing effect for active windows
                            const pulse = Math.sin(Date.now() * 0.0005 + Math.random() * 10) * 0.05 + 0.95;
                            material.emissiveIntensity = isNightTime.current ? 
                                0.2 * pulse : 
                                0.1 * pulse;
                        }
                    });
                }
            });
        }
    }, []);

    return (
        <>
            {/* Dark overlay for better contrast */}
            <div 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: -2,
                    background: isNightTime.current 
                        ? 'linear-gradient(135deg, #0a1525, #0c1a30, #0e2040)' 
                        : 'linear-gradient(135deg, #87ceeb, #a0d8ef, #b5e2f7)',
                    opacity: 0.8
                }}
            />
            
            {/* Scroll indicators */}
            <div 
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '20px',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    fontSize: '24px',
                    opacity: 0.7,
                    zIndex: 5,
                    pointerEvents: 'none',
                    textShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
            >
                ◀
            </div>
            
            <div 
                style={{
                    position: 'fixed',
                    top: '50%',
                    right: '20px',
                    transform: 'translateY(-50%)',
                    color: 'white',
                    fontSize: '24px',
                    opacity: 0.7,
                    zIndex: 5,
                    pointerEvents: 'none',
                    textShadow: '0 0 10px rgba(0,0,0,0.5)'
                }}
            >
                ▶
            </div>
            
            <div 
                ref={containerRef} 
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100vw',
                    height: '100vh',
                    zIndex: -1,
                    overflow: 'hidden'
                }}
            />
            
            {/* Building tooltip */}
            {hoveredBuilding && (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: isNightTime.current ? 'rgba(10, 30, 50, 0.8)' : 'rgba(40, 80, 120, 0.8)',
                    color: 'white',
                    padding: '10px 16px',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: 500,
                    zIndex: 10,
                    pointerEvents: 'none',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
                    textAlign: 'center',
                    maxWidth: '300px',
                    backdropFilter: 'blur(5px)',
                    border: `1px solid ${hoveredBuilding.color}40` // 25% opacity border using the building color
                }}>
                    <div style={{ 
                        fontWeight: 600, 
                        marginBottom: '4px',
                        color: hoveredBuilding.color
                    }}>
                        {hoveredBuilding.name}
                    </div>
                    <div style={{ 
                        fontSize: '14px',
                        opacity: 0.9
                    }}>
                        {hoveredBuilding.description}
                    </div>
                    {!hoveredBuilding.isActive && (
                        <div style={{ 
                            fontSize: '12px',
                            marginTop: '6px',
                            padding: '3px 8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            borderRadius: '4px',
                            display: 'inline-block',
                            fontStyle: 'italic'
                        }}>
                            Coming soon
                        </div>
                    )}
                </div>
            )}
        </>
    );
}