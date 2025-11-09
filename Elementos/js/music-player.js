/**
 * Reproductor de Música para Tomar Prueba
 * Reproduce playlist de YouTube para concentración durante exámenes
 */

class MusicPlayer {
    constructor() {
        this.currentTrackIndex = 0;
        this.isPlaying = false;
        this.isMuted = false;
        this.volume = 0.5;
        this.player = null;
        this.isPlayerReady = false;
        
        // Lista de videos de la playlist por defecto
        this.playlistPorDefecto = [
            {
                id: 'QzlcxmVBIFo',
                title: 'Música para Estudiar y Concentrarse'
            },
            {
                id: 'lFcSrYw-ARY',
                title: 'Sonidos Relajantes de la Naturaleza'
            },
            {
                id: 'hHW1oY26kxQ',
                title: 'Música Instrumental Suave'
            },
            {
                id: '5qap5aO4i9A',
                title: 'Música Clásica para Estudiar'
            },
            {
                id: 'M4QVjBzuVdc',
                title: 'Música Ambiental Relajante'
            },
            {
                id: 'DWcJFNfaw9c',
                title: 'Sonidos del Océano'
            },
            {
                id: 'UfcAVejslrU',
                title: 'Música para Concentración Profunda'
            },
            {
                id: 'kK42LZqO0wA',
                title: 'Piano Suave para Estudiar'
            },
            {
                id: 'jfKfPfyJRdk',
                title: 'Música Lo-Fi para Estudiar'
            },
            {
                id: 'n61ULEU7CO0',
                title: 'Música de Fondo para Concentración'
            }
        ];
        
        // Usar playlist por defecto inicialmente
        this.playlist = [...this.playlistPorDefecto];

        this.initializeElements();
        this.cargarPlaylistPersonalizada();
        this.loadYouTubeAPI();
        this.setupEventListeners();
    }

    initializeElements() {
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.prevTrackBtn = document.getElementById('prevTrackBtn');
        this.nextTrackBtn = document.getElementById('nextTrackBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.trackTitle = document.getElementById('trackTitle');
        this.volumeControl = document.getElementById('volumeControl');
    }

    loadYouTubeAPI() {
        // Cargar la API de YouTube si no está ya cargada
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        // Configurar el callback cuando la API esté lista
        window.onYouTubeIframeAPIReady = () => {
            this.initializePlayer();
        };

        // Si la API ya está cargada
        if (window.YT && window.YT.Player) {
            this.initializePlayer();
        }
    }

    initializePlayer() {
        // Crear un div oculto para el reproductor de YouTube
        const playerDiv = document.createElement('div');
        playerDiv.id = 'youtube-player';
        playerDiv.style.display = 'none';
        document.body.appendChild(playerDiv);

        this.player = new YT.Player('youtube-player', {
            height: '0',
            width: '0',
            videoId: this.playlist[0].id,
            playerVars: {
                autoplay: 0,
                controls: 0,
                disablekb: 1,
                fs: 0,
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                showinfo: 0
            },
            events: {
                onReady: (event) => {
                    this.isPlayerReady = true;
                    this.player.setVolume(this.volume * 100);
                    this.updateTrackTitle();
                },
                onStateChange: (event) => {
                    if (event.data === YT.PlayerState.ENDED) {
                        this.nextTrack();
                    }
                    if (event.data === YT.PlayerState.PLAYING) {
                        this.isPlaying = true;
                        this.updatePlayPauseButton();
                    }
                    if (event.data === YT.PlayerState.PAUSED) {
                        this.isPlaying = false;
                        this.updatePlayPauseButton();
                    }
                }
            }
        });
    }

    setupEventListeners() {
        // Botón play/pause
        this.playPauseBtn.addEventListener('click', () => {
            this.togglePlayPause();
        });

        // Botón anterior
        this.prevTrackBtn.addEventListener('click', () => {
            this.prevTrack();
        });

        // Botón siguiente
        this.nextTrackBtn.addEventListener('click', () => {
            this.nextTrack();
        });

        // Botón de volumen
        this.volumeBtn.addEventListener('click', () => {
            this.toggleMute();
        });

        // Control de volumen
        this.volumeSlider.addEventListener('input', (e) => {
            this.setVolume(e.target.value / 100);
        });

        // Mostrar/ocultar control de volumen
        this.volumeBtn.addEventListener('mouseenter', () => {
            this.volumeControl.style.display = 'block';
        });

        this.volumeControl.addEventListener('mouseleave', () => {
            setTimeout(() => {
                this.volumeControl.style.display = 'none';
            }, 1000);
        });
    }

    togglePlayPause() {
        if (!this.isPlayerReady) return;

        if (this.isPlaying) {
            this.player.pauseVideo();
        } else {
            this.player.playVideo();
        }
    }

    prevTrack() {
        if (!this.isPlayerReady) return;

        this.currentTrackIndex = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
        this.loadCurrentTrack();
    }

    nextTrack() {
        if (!this.isPlayerReady) return;

        this.currentTrackIndex = (this.currentTrackIndex + 1) % this.playlist.length;
        this.loadCurrentTrack();
    }

    loadCurrentTrack() {
        if (!this.isPlayerReady) return;

        const currentTrack = this.playlist[this.currentTrackIndex];
        this.player.loadVideoById(currentTrack.id);
        this.updateTrackTitle();
        
        if (this.isPlaying) {
            setTimeout(() => {
                this.player.playVideo();
            }, 1000);
        }
    }

    toggleMute() {
        if (!this.isPlayerReady) return;

        if (this.isMuted) {
            this.player.unMute();
            this.isMuted = false;
            this.volumeBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        } else {
            this.player.mute();
            this.isMuted = true;
            this.volumeBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        }
    }

    setVolume(volume) {
        if (!this.isPlayerReady) return;

        this.volume = volume;
        this.player.setVolume(volume * 100);
        
        // Actualizar icono de volumen
        if (volume === 0) {
            this.volumeBtn.innerHTML = '<i class="bi bi-volume-mute-fill"></i>';
        } else if (volume < 0.5) {
            this.volumeBtn.innerHTML = '<i class="bi bi-volume-down-fill"></i>';
        } else {
            this.volumeBtn.innerHTML = '<i class="bi bi-volume-up-fill"></i>';
        }
    }

    updatePlayPauseButton() {
        if (this.isPlaying) {
            this.playPauseBtn.innerHTML = '<i class="bi bi-pause-fill"></i>';
            this.playPauseBtn.classList.add('playing');
        } else {
            this.playPauseBtn.innerHTML = '<i class="bi bi-play-fill"></i>';
            this.playPauseBtn.classList.remove('playing');
        }
    }

    updateTrackTitle() {
        const currentTrack = this.playlist[this.currentTrackIndex];
        this.trackTitle.textContent = currentTrack.title;
    }

    // Cargar playlist personalizada del usuario desde Firebase
    async cargarPlaylistPersonalizada() {
        try {
            // Esperar a que Firebase esté disponible
            await this.esperarFirebase();
            
            const db = window.firebaseDB;
            const currentUser = JSON.parse(sessionStorage.getItem('currentUser') || '{}');
            
            if (!currentUser.id) {
                console.log('No hay usuario logueado, usando playlist por defecto');
                return;
            }
            
            const usuarioId = currentUser.id || currentUser.numeroDocumento;
            const playlistDoc = await db.collection('playlistsPersonales').doc(usuarioId).get();
            
            if (playlistDoc.exists) {
                const data = playlistDoc.data();
                if (data.canciones && data.canciones.length > 0) {
                    this.playlist = data.canciones;
                    console.log('Playlist personalizada cargada:', this.playlist.length, 'canciones');
                    
                    // Actualizar título de la canción actual
                    if (this.trackTitle) {
                        this.updateTrackTitle();
                    }
                } else {
                    console.log('Playlist vacía, usando por defecto');
                }
            } else {
                console.log('No hay playlist personalizada, usando por defecto');
            }
            
        } catch (error) {
            console.error('Error al cargar playlist personalizada:', error);
            console.log('Usando playlist por defecto');
        }
    }
    
    // Esperar a que Firebase esté disponible
    esperarFirebase() {
        return new Promise((resolve) => {
            const checkFirebase = () => {
                if (window.firebaseDB) {
                    resolve();
                } else {
                    setTimeout(checkFirebase, 100);
                }
            };
            checkFirebase();
        });
    }
    
    // Actualizar playlist (puede ser llamado desde el panel de usuario)
    actualizarPlaylist(nuevaPlaylist) {
        if (!nuevaPlaylist || nuevaPlaylist.length === 0) {
            console.log('Playlist vacía, manteniendo actual');
            return;
        }
        
        this.playlist = nuevaPlaylist;
        this.currentTrackIndex = 0;
        
        console.log('Playlist actualizada:', this.playlist.length, 'canciones');
        
        // Si el reproductor está listo, cargar la primera canción
        if (this.isPlayerReady) {
            this.loadCurrentTrack();
        }
    }
}

// Inicializar el reproductor cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.musicPlayer = new MusicPlayer();
});