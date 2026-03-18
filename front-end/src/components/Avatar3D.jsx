/**
 * Avatar 3D Component
 * Renders a 3D avatar using React Three Fiber
 * 
 * Features:
 * - Loads base GLB model from Ready Player Me
 * - Conditionally attaches accessories based on level
 * - Applies Mixamo animations
 * - Smooth transitions on unlock
 * - Fallback to procedural avatar if no GLB provided
 * 
 * Dependencies: @react-three/fiber, @react-three/drei, three
 */

import { Suspense, useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  useGLTF, 
  useAnimations, 
  OrbitControls, 
  Environment,
  ContactShadows,
  Html,
  useProgress,
  Float,
  Sphere,
  Box,
  Cylinder
} from '@react-three/drei';
import * as THREE from 'three';

// Loading component for suspense fallback
const Loader = () => {
  const { progress } = useProgress();
  return (
    <Html center>
      <div className="flex flex-col items-center gap-2">
        <div className="w-16 h-16 border-4 border-[#1a3884]/30 border-t-[#1a3884] rounded-full animate-spin" />
        <p className="text-white text-sm">{progress.toFixed(0)}%</p>
      </div>
    </Html>
  );
};

// Procedural Avatar - Fallback when no GLB is available
const ProceduralAvatar = ({ accessories = {}, celebrating = false }) => {
  const groupRef = useRef();
  const [hue, setHue] = useState(0);
  
  useFrame((state) => {
    if (groupRef.current) {
      // Gentle idle animation
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      groupRef.current.position.y = Math.sin(state.clock.elapsedTime * 0.8) * 0.05 - 0.5;
      
      // Celebration bounce
      if (celebrating) {
        groupRef.current.position.y = Math.abs(Math.sin(state.clock.elapsedTime * 5)) * 0.3 - 0.5;
        groupRef.current.rotation.y = state.clock.elapsedTime * 2;
      }
    }
  });
  
  const skinColor = "#f5d6bc";
  const shirtColor = "#1a3884";
  const pantsColor = "#002147";
  
  return (
    <group ref={groupRef} position={[0, -0.5, 0]}>
      {/* Head */}
      <Sphere args={[0.35, 32, 32]} position={[0, 1.1, 0]}>
        <meshStandardMaterial color={skinColor} />
      </Sphere>
      
      {/* Body */}
      <Cylinder args={[0.25, 0.3, 0.6, 16]} position={[0, 0.5, 0]}>
        <meshStandardMaterial color={shirtColor} />
      </Cylinder>
      
      {/* Legs */}
      <Cylinder args={[0.12, 0.12, 0.5, 16]} position={[-0.12, 0, 0]}>
        <meshStandardMaterial color={pantsColor} />
      </Cylinder>
      <Cylinder args={[0.12, 0.12, 0.5, 16]} position={[0.12, 0, 0]}>
        <meshStandardMaterial color={pantsColor} />
      </Cylinder>
      
      {/* Arms */}
      <Cylinder args={[0.08, 0.08, 0.4, 16]} position={[-0.35, 0.5, 0]} rotation={[0, 0, Math.PI / 6]}>
        <meshStandardMaterial color={skinColor} />
      </Cylinder>
      <Cylinder args={[0.08, 0.08, 0.4, 16]} position={[0.35, 0.5, 0]} rotation={[0, 0, -Math.PI / 6]}>
        <meshStandardMaterial color={skinColor} />
      </Cylinder>
      
      {/* Hair */}
      <Sphere args={[0.36, 16, 16]} position={[0, 1.2, 0]} scale={[1, 0.5, 1]}>
        <meshStandardMaterial color="#3d2314" />
      </Sphere>
      
      {/* Eyes */}
      <Sphere args={[0.05, 16, 16]} position={[-0.1, 1.15, 0.3]}>
        <meshStandardMaterial color="white" />
      </Sphere>
      <Sphere args={[0.05, 16, 16]} position={[0.1, 1.15, 0.3]}>
        <meshStandardMaterial color="white" />
      </Sphere>
      <Sphere args={[0.025, 16, 16]} position={[-0.1, 1.15, 0.35]}>
        <meshStandardMaterial color="#2a1f17" />
      </Sphere>
      <Sphere args={[0.025, 16, 16]} position={[0.1, 1.15, 0.35]}>
        <meshStandardMaterial color="#2a1f17" />
      </Sphere>
      
      {/* Shoes - if unlocked */}
      {accessories.shoes?.equipped && (
        <>
          <Box args={[0.15, 0.08, 0.25]} position={[-0.12, -0.28, 0.05]}>
            <meshStandardMaterial color="#1a1a1a" />
          </Box>
          <Box args={[0.15, 0.08, 0.25]} position={[0.12, -0.28, 0.05]}>
            <meshStandardMaterial color="#1a1a1a" />
          </Box>
        </>
      )}
      
      {/* Jacket - if unlocked */}
      {accessories.jacket?.equipped && (
        <Cylinder args={[0.28, 0.33, 0.62, 16]} position={[0, 0.5, 0]}>
          <meshStandardMaterial color="#1a1a1a" />
        </Cylinder>
      )}
      
      {/* Glasses - if unlocked */}
      {accessories.glasses?.equipped && (
        <group position={[0, 1.15, 0.35]}>
          <Cylinder args={[0.08, 0.08, 0.02, 16]} position={[-0.1, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#333" transparent opacity={0.5} />
          </Cylinder>
          <Cylinder args={[0.08, 0.08, 0.02, 16]} position={[0.1, 0, 0]} rotation={[Math.PI/2, 0, 0]}>
            <meshStandardMaterial color="#333" transparent opacity={0.5} />
          </Cylinder>
          <Cylinder args={[0.01, 0.01, 0.08, 8]} position={[0, 0, 0]} rotation={[0, 0, Math.PI/2]}>
            <meshStandardMaterial color="#333" />
          </Cylinder>
        </group>
      )}
    </group>
  );
};

// Main Avatar Model Component (for GLB models)
const AvatarModel = ({ 
  baseModelUrl, 
  accessories = {}, 
  currentAnimation = 'idle',
  animationUrls = {},
  onLoaded,
  autoRotate = true
}) => {
  const group = useRef();
  const { scene, animations } = useGLTF(baseModelUrl);
  const { actions, mixer } = useAnimations(animations, group);
  
  // Clone the scene to avoid mutation issues
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  // Handle animation changes
  useEffect(() => {
    if (actions && Object.keys(actions).length > 0) {
      // Fade out all current animations
      Object.values(actions).forEach(action => {
        action.fadeOut(0.5);
      });
      
      // Get the animation to play
      const animationName = currentAnimation || 'idle';
      const action = actions[animationName] || Object.values(actions)[0];
      
      if (action) {
        action.reset().fadeIn(0.5).play();
      }
    }
    
    if (onLoaded) onLoaded();
  }, [actions, currentAnimation, onLoaded]);
  
  // Subtle idle movement
  useFrame((state) => {
    if (group.current && autoRotate) {
      // Gentle breathing/idle motion
      group.current.position.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });
  
  return (
    <group ref={group} dispose={null}>
      <primitive object={clonedScene} scale={1} position={[0, -1, 0]} />
    </group>
  );
};

// Accessory Component - loads and attaches accessories
const Accessory = ({ url, attachTo, visible }) => {
  const { scene } = useGLTF(url);
  
  if (!visible) return null;
  
  return (
    <primitive 
      object={scene.clone()} 
      scale={1} 
      position={[0, -1, 0]} 
    />
  );
};

// Level indicator floating around avatar
const LevelIndicator = ({ level, xp, xpToNext }) => {
  const progress = Math.min(100, (xp / xpToNext) * 100);
  
  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <Html position={[0, 1.5, 0]} center distanceFactor={5}>
        <div className="flex flex-col items-center pointer-events-none select-none">
          <div className="bg-gradient-to-r from-[#1a3884] to-[#132c6b] px-4 py-1.5 rounded-full shadow-lg">
            <span className="text-white font-bold text-sm">Level {level}</span>
          </div>
          <div className="mt-1 w-20 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#C0C0C0] transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </Html>
    </Float>
  );
};

// Particle effects for celebrations
const CelebrationParticles = ({ active }) => {
  const particlesRef = useRef();
  const count = 50;
  
  const particles = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      temp.push({
        position: [
          (Math.random() - 0.5) * 3,
          Math.random() * 2,
          (Math.random() - 0.5) * 3
        ],
        speed: 0.5 + Math.random() * 1.5,
        color: ['#1a3884', '#C0C0C0', '#ff6b6b', '#4ecdc4'][Math.floor(Math.random() * 4)]
      });
    }
    return temp;
  }, []);
  
  useFrame((state) => {
    if (particlesRef.current && active) {
      particlesRef.current.children.forEach((particle, i) => {
        particle.position.y += particles[i].speed * 0.02;
        particle.rotation.x += 0.02;
        particle.rotation.y += 0.02;
        
        if (particle.position.y > 3) {
          particle.position.y = -1;
        }
      });
    }
  });
  
  if (!active) return null;
  
  return (
    <group ref={particlesRef}>
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <boxGeometry args={[0.05, 0.05, 0.05]} />
          <meshStandardMaterial color={p.color} emissive={p.color} emissiveIntensity={0.5} />
        </mesh>
      ))}
    </group>
  );
};

// Main Avatar3D Component - The exportable component
const Avatar3D = ({
  avatarData = {},
  showControls = true,
  showLevelIndicator = true,
  autoRotate = true,
  className = "",
  onLoadComplete,
  celebrating = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Default avatar data structure
  const {
    baseModel = '', // Empty by default - will use procedural avatar
    level = 1,
    xp = 0,
    xpToNextLevel = 100,
    accessories = {
      shoes: { unlocked: false, equipped: false, modelUrl: null },
      jacket: { unlocked: false, equipped: false, modelUrl: null },
      glasses: { unlocked: false, equipped: false, modelUrl: null }
    },
    currentAnimation = 'idle'
  } = avatarData;
  
  // Check if we have a valid GLB model URL
  const hasGLBModel = baseModel && baseModel.endsWith('.glb');
  
  const handleLoaded = () => {
    setIsLoaded(true);
    if (onLoadComplete) onLoadComplete();
  };
  
  // Auto-set loaded for procedural avatar
  useEffect(() => {
    if (!hasGLBModel) {
      setIsLoaded(true);
      if (onLoadComplete) onLoadComplete();
    }
  }, [hasGLBModel, onLoadComplete]);
  
  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        camera={{ position: [0, 0.5, 3], fov: 45 }}
        shadows
        dpr={[1, 2]}
        gl={{ 
          antialias: true,
          preserveDrawingBuffer: true 
        }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[5, 5, 5]} 
          intensity={1} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight 
          position={[-5, 5, 0]} 
          intensity={0.5} 
          angle={0.5} 
          penumbra={1}
        />
        
        {/* Environment for reflections */}
        <Environment preset="city" />
        
        {/* Main content with loading fallback */}
        <Suspense fallback={<Loader />}>
          {/* Use procedural avatar if no GLB model, otherwise load GLB */}
          {hasGLBModel ? (
            <AvatarModel
              baseModelUrl={baseModel}
              accessories={accessories}
              currentAnimation={celebrating ? 'celebrate' : currentAnimation}
              onLoaded={handleLoaded}
              autoRotate={autoRotate}
            />
          ) : (
            <ProceduralAvatar 
              accessories={accessories} 
              celebrating={celebrating}
            />
          )}
          
          {/* Accessories (loaded conditionally - only for GLB models) */}
          {hasGLBModel && accessories.shoes?.equipped && accessories.shoes?.modelUrl && (
            <Accessory 
              url={accessories.shoes.modelUrl} 
              attachTo="feet" 
              visible={true} 
            />
          )}
          {hasGLBModel && accessories.jacket?.equipped && accessories.jacket?.modelUrl && (
            <Accessory 
              url={accessories.jacket.modelUrl} 
              attachTo="torso" 
              visible={true} 
            />
          )}
          {hasGLBModel && accessories.glasses?.equipped && accessories.glasses?.modelUrl && (
            <Accessory 
              url={accessories.glasses.modelUrl} 
              attachTo="head" 
              visible={true} 
            />
          )}
          
          {/* Level indicator */}
          {showLevelIndicator && (
            <LevelIndicator 
              level={level} 
              xp={xp} 
              xpToNext={xpToNextLevel} 
            />
          )}
          
          {/* Celebration particles */}
          <CelebrationParticles active={celebrating} />
          
          {/* Ground shadow */}
          <ContactShadows 
            position={[0, -1, 0]} 
            opacity={0.4} 
            scale={5} 
            blur={2} 
          />
        </Suspense>
        
        {/* Camera controls */}
        {showControls && (
          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minPolarAngle={Math.PI / 4}
            maxPolarAngle={Math.PI / 2}
            minDistance={2}
            maxDistance={5}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        )}
      </Canvas>
    </div>
  );
};

// Preload hook for better performance
export const preloadAvatar = (url) => {
  useGLTF.preload(url);
};

export default Avatar3D;



