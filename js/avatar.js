import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let mixer;
let actionDictionary = {};
let activeAction;
let renderer, scene, camera;
let isInitialized = false;

export const Avatar = {
    init: function(containerId, score) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // 초기화 방지 및 재사용시 상태 갱신
        if (isInitialized) {
            this.setScoreState(score);
            return;
        }

        container.innerHTML = ''; 

        scene = new THREE.Scene();
        scene.background = new THREE.Color( 0xf7f7f7 );
        scene.fog = new THREE.Fog( 0xf7f7f7, 2, 10 );

        camera = new THREE.PerspectiveCamera( 45, container.clientWidth / container.clientHeight, 0.25, 100 );
        // 약간 위에서 아래로 바라보는 앵글 설정 (근접)
        camera.position.set( -1.5, 2.5, 3.5 );
        camera.lookAt( 0, 1, 0 );

        // 조명 추가
        const hemiLight = new THREE.HemisphereLight( 0xffffff, 0x8d8d8d, 2.0 );
        hemiLight.position.set( 0, 20, 0 );
        scene.add( hemiLight );

        const dirLight = new THREE.DirectionalLight( 0xffffff, 2.0 );
        dirLight.position.set( 3, 10, 10 );
        scene.add( dirLight );

        // 바닥 메시
        const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 200, 200 ), new THREE.MeshPhongMaterial( { color: 0xeeeeee, depthWrite: false } ) );
        mesh.rotation.x = - Math.PI / 2;
        scene.add( mesh );

        // 렌더러 설정
        renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( container.clientWidth, container.clientHeight );
        container.appendChild( renderer.domElement );

        // 모델 로더 (jsdelivr의 Three.js examples 디렉토리 마스터 에셋 사용)
        const loader = new GLTFLoader();
        loader.load( 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/models/gltf/RobotExpressive/RobotExpressive.glb', ( gltf ) => {

            const model = gltf.scene;
            scene.add( model );

            mixer = new THREE.AnimationMixer( model );

            // 클립 딕셔너리 구축 (Idle, Walking, Running, Dance, Death, Sitting, Standing, Jump, Yes, No, Wave, Punch, ThumbsUp 등)
            for ( let i = 0; i < gltf.animations.length; i ++ ) {
                const clip = gltf.animations[ i ];
                const action = mixer.clipAction( clip );
                actionDictionary[ clip.name ] = action;
            }

            // 점수 기반 애니메이션 설정
            this.setScoreState(score);

            isInitialized = true;
        }, undefined, (e) => {
            console.error('3D 모델 다운로드 오류:', e);
            container.innerHTML = '<p class="sub-text" style="text-align:center; padding-top:20px;">아바타 로딩 실패</p>';
        });

        // 렌더 루프
        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame( animate );
            const dt = clock.getDelta();
            if ( mixer ) mixer.update( dt );
            renderer.render( scene, camera );
        }

        animate();

        // 리사이즈 핸들링
        window.addEventListener('resize', () => {
            if (!container || !camera || !renderer) return;
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    },

    setScoreState: function(score) {
        if (!actionDictionary || Object.keys(actionDictionary).length === 0) return;

        let newState = 'Idle';
        
        // 높은 점수(80이상) -> Dance, ThumbsUp
        // 중간 점수(50이상) -> Walking, Yes, Idle
        // 낮은 점수(50미만) -> Sitting, Sad(No)
        if (score >= 80) {
            newState = 'Dance';
        } else if (score >= 60) {
            newState = 'ThumbsUp';
        } else if (score >= 40) {
            newState = 'Walking';
        } else {
            newState = 'Sitting'; 
        }

        // 특정 애니메이션은 루핑하지 않게 조정 (ThumbsUp 등)
        if (newState === 'ThumbsUp') {
            const act = actionDictionary[newState];
            if(act) {
               act.setLoop(THREE.LoopOnce, 1);
               act.clampWhenFinished = true;
               // 끝나면 다시 Idle
               mixer.addEventListener('finished', (e) => {
                   if (e.action === act) {
                       this.fadeToAction('Idle', 0.5);
                   }
               });
            }
        }

        this.fadeToAction(newState, 0.5);
    },

    fadeToAction: function(name, duration) {
        const nextAction = actionDictionary[name];
        if (!nextAction) return;

        if (activeAction) {
            if (activeAction === nextAction) return; // 이미 실행중
            activeAction.fadeOut(duration);
        }

        nextAction.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).fadeIn(duration).play();
        activeAction = nextAction;
    }
};
