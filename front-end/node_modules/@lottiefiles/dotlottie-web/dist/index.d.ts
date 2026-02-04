interface Marker {
    duration: number;
    name: string;
    time: number;
}

/**
 * Represents the different types of events that can be dispatched.
 */
type EventType = 'complete' | 'frame' | 'load' | 'loadError' | 'renderError' | 'loop' | 'pause' | 'play' | 'stop' | 'destroy' | 'freeze' | 'unfreeze' | 'render' | 'ready' | 'stateMachineStart' | 'stateMachineStop' | 'stateMachineTransition' | 'stateMachineStateEntered' | 'stateMachineStateExit' | 'stateMachineCustomEvent' | 'stateMachineError' | 'stateMachineBooleanInputValueChange' | 'stateMachineNumericInputValueChange' | 'stateMachineStringInputValueChange' | 'stateMachineInputFired' | 'stateMachineInternalMessage';
/**
 * Maps an event type string to its respective event interface.
 */
type EventByType<T extends EventType> = Extract<Event, {
    type: T;
}>;
/**
 * Base interface for all events.
 */
interface BaseEvent {
    type: EventType;
}
interface RenderEvent extends BaseEvent {
    currentFrame: number;
    type: 'render';
}
interface FreezeEvent extends BaseEvent {
    type: 'freeze';
}
interface UnfreezeEvent extends BaseEvent {
    type: 'unfreeze';
}
interface DestroyEvent extends BaseEvent {
    type: 'destroy';
}
/**
 * Event fired when a loop action occurs.
 */
interface LoopEvent extends BaseEvent {
    loopCount: number;
    type: 'loop';
}
/**
 * Event fired during frame changes.
 */
interface FrameEvent extends BaseEvent {
    currentFrame: number;
    type: 'frame';
}
/**
 * Event fired when a load action occurs.
 */
interface LoadEvent extends BaseEvent {
    type: 'load';
}
/**
 * Event fired when a loading error occurs.
 */
interface LoadErrorEvent extends BaseEvent {
    error: Error;
    type: 'loadError';
}
/**
 * Event fired when a loading error occurs.
 */
interface RenderErrorEvent extends BaseEvent {
    error: Error;
    type: 'renderError';
}
/**
 * Event fired when a completion action occurs.
 */
interface CompleteEvent extends BaseEvent {
    type: 'complete';
}
/**
 * Event fired when a pause action occurs.
 */
interface PauseEvent extends BaseEvent {
    type: 'pause';
}
/**
 * Event fired when a play action occurs.
 */
interface PlayEvent extends BaseEvent {
    type: 'play';
}
/**
 * Event fired when a stop action occurs.
 */
interface StopEvent extends BaseEvent {
    type: 'stop';
}
/**
 * Event fired when a WASM module is initialized and ready.
 */
interface ReadyEvent extends BaseEvent {
    type: 'ready';
}
interface StateMachineStartEvent extends BaseEvent {
    type: 'stateMachineStart';
}
interface StateMachineStopEvent extends BaseEvent {
    type: 'stateMachineStop';
}
interface StateMachineTransitionEvent extends BaseEvent {
    fromState: string;
    toState: string;
    type: 'stateMachineTransition';
}
interface StateMachineStateEnteredEvent extends BaseEvent {
    state: string;
    type: 'stateMachineStateEntered';
}
interface StateMachineStateExitEvent extends BaseEvent {
    state: string;
    type: 'stateMachineStateExit';
}
interface StateMachineCustomEvent extends BaseEvent {
    eventName: string;
    type: 'stateMachineCustomEvent';
}
interface StateMachineErrorEvent extends BaseEvent {
    error: string;
    type: 'stateMachineError';
}
interface StateMachineBooleanInputValueChangeEvent extends BaseEvent {
    inputName: string;
    newValue: boolean;
    oldValue: boolean;
    type: 'stateMachineBooleanInputValueChange';
}
interface StateMachineNumericInputValueChangeEvent extends BaseEvent {
    inputName: string;
    newValue: number;
    oldValue: number;
    type: 'stateMachineNumericInputValueChange';
}
interface StateMachineStringInputValueChangeEvent extends BaseEvent {
    inputName: string;
    newValue: string;
    oldValue: string;
    type: 'stateMachineStringInputValueChange';
}
interface StateMachineInputFiredEvent extends BaseEvent {
    inputName: string;
    type: 'stateMachineInputFired';
}
interface StateMachineInternalMessage extends BaseEvent {
    message: string;
    type: 'stateMachineInternalMessage';
}
/**
 * Type representing all possible event types.
 */
type Event = LoopEvent | FrameEvent | LoadEvent | LoadErrorEvent | RenderErrorEvent | CompleteEvent | PauseEvent | PlayEvent | StopEvent | DestroyEvent | FreezeEvent | UnfreezeEvent | RenderEvent | ReadyEvent | StateMachineStartEvent | StateMachineStopEvent | StateMachineTransitionEvent | StateMachineStateEnteredEvent | StateMachineStateExitEvent | StateMachineCustomEvent | StateMachineErrorEvent | StateMachineBooleanInputValueChangeEvent | StateMachineNumericInputValueChangeEvent | StateMachineStringInputValueChangeEvent | StateMachineInputFiredEvent | StateMachineInternalMessage;
interface EventListener<T extends EventType> {
    (event: EventByType<T>): void;
}
/**
 * Manages registration and dispatching of event listeners.
 */
declare class EventManager {
    private readonly _eventListeners;
    addEventListener<T extends EventType>(type: T, listener: EventListener<T>): void;
    removeEventListener<T extends EventType>(type: T, listener?: EventListener<T>): void;
    dispatch<T extends EventType>(event: EventByType<T>): void;
    removeAllEventListeners(): void;
}

/**
 * 3x3 transformation matrix for the entire animation on the canvas.
 * Represented as a flattened 9-element tuple in row-major order: [m00, m01, m02, m10, m11, m12, m20, m21, m22].
 * Used for affine transformations (translation, rotation, scale, skew) applied to the whole animation.
 */
type Transform = [number, number, number, number, number, number, number, number, number];
/**
 * Configuration for canvas rendering behavior.
 * Controls how the animation is rendered and when rendering is optimized.
 */
interface RenderConfig {
    /**
     * Automatically resize canvas when container size changes.
     * Set to true to maintain responsiveness without manual resize calls.
     */
    autoResize?: boolean;
    /**
     * Pixel density multiplier for high-DPI displays.
     * Higher values increase quality but use more memory. Defaults to window.devicePixelRatio.
     */
    devicePixelRatio?: number;
    /**
     * Pause rendering when canvas is outside the viewport.
     * Set to true (default) to improve performance when animation isn't visible.
     */
    freezeOnOffscreen?: boolean;
    /**
     * Rendering quality level (0-100).
     * Lower values reduce quality but improve performance on resource-constrained devices.
     */
    quality?: number;
}
/**
 * Animation playback direction mode.
 * Determines how frames are sequenced: forward, reverse, or alternating (bounce) modes.
 */
type Mode = 'forward' | 'reverse' | 'bounce' | 'reverse-bounce';
/**
 * Animation data format accepted by the player.
 * Can be a JSON string, binary ArrayBuffer, or parsed JSON object.
 */
type Data = string | ArrayBuffer | Record<string, unknown>;
/**
 * Layout fit mode determining how animation scales to canvas.
 * Controls scaling behavior similar to CSS object-fit property.
 */
type Fit = 'contain' | 'cover' | 'fill' | 'none' | 'fit-width' | 'fit-height';
/**
 * Layout configuration for positioning and scaling animations within the canvas.
 * Determines how the animation fits and aligns within the available space.
 */
interface Layout {
    /**
     * Alignment position as [x, y] coordinates in 0-1 range.
     * [0.5, 0.5] centers the animation, [0, 0] is top-left, [1, 1] is bottom-right.
     */
    align?: [number, number];
    /**
     * Fit mode controlling how animation scales to canvas dimensions.
     * Defaults to 'contain' to show the full animation without cropping.
     */
    fit?: Fit;
}
/**
 * Dimensions of a rendering surface for custom canvas implementations.
 * Used when providing a custom render surface instead of HTMLCanvasElement.
 */
interface RenderSurface {
    /** Height of the render surface in pixels */
    height: number;
    /** Width of the render surface in pixels */
    width: number;
}
/**
 * Main configuration object for initializing a DotLottie player.
 * Specifies the animation source, playback behavior, rendering options, and canvas target.
 */
interface Config {
    /**
     * ID of the specific animation to play from a multi-animation dotLottie file.
     * Leave undefined for single-animation files or to play the default animation.
     */
    animationId?: string;
    /**
     * Automatically start playback once the animation is loaded.
     * Set to true for animations that should play immediately without user interaction.
     */
    autoplay?: boolean;
    /**
     * Background color as a CSS color string (e.g., '#FFFFFF' or 'transparent').
     * Applied to the canvas element or as a fill behind the animation.
     */
    backgroundColor?: string;
    /**
     * Target canvas element for rendering.
     * Can be HTMLCanvasElement, OffscreenCanvas, or custom RenderSurface with dimensions.
     */
    canvas?: HTMLCanvasElement | OffscreenCanvas | RenderSurface;
    /**
     * Animation data to load directly.
     * Use this to load from a string, ArrayBuffer, or parsed JSON instead of fetching from src.
     */
    data?: Data;
    /**
     * Layout configuration for positioning and scaling the animation.
     * Controls fit mode and alignment within the canvas.
     */
    layout?: Layout;
    /**
     * Enable continuous looping of the animation.
     * Set to true to repeat indefinitely, or use loopCount for a specific number of loops.
     */
    loop?: boolean;
    /**
     * Number of additional times to replay the animation after the first play.
     * Requires `loop` to be true. A value of 0 means infinite replays; a positive value `n` means
     * the animation plays a total of `n + 1` times (initial play + `n` replays).
     */
    loopCount?: number;
    /**
     * Named marker to use as the playback segment.
     * Plays only the portion of the animation defined by this marker instead of the full animation.
     */
    marker?: string;
    /**
     * Playback direction mode.
     * Controls whether animation plays forward, reverse, or alternates (bounce).
     */
    mode?: Mode;
    /**
     * Rendering configuration controlling canvas behavior.
     * Includes autoResize, devicePixelRatio, freezeOnOffscreen, and quality settings.
     */
    renderConfig?: RenderConfig;
    /**
     * Frame range to play as [startFrame, endFrame].
     * Restricts playback to a specific portion of the animation instead of the full sequence.
     */
    segment?: [number, number];
    /**
     * Playback speed multiplier.
     * 1 is normal speed, 2 is double speed, 0.5 is half speed.
     */
    speed?: number;
    /**
     * URL to fetch the animation from.
     * Use this to load .lottie or .json files from a remote or local path.
     */
    src?: string;
    /**
     * State machine security configuration.
     * Controls URL opening policies for state machine-driven animations.
     */
    stateMachineConfig?: StateMachineConfig;
    /**
     * ID of the state machine to load and activate.
     * State machines enable interactive, event-driven animation behaviors.
     */
    stateMachineId?: string;
    /**
     * ID of the theme to apply to the animation.
     * Themes modify colors and visual properties defined in the dotLottie manifest.
     */
    themeId?: string;
    /**
     * Enable frame interpolation for smoother playback.
     * Set to true (default) for smoother animation, false for exact frame-by-frame playback.
     */
    useFrameInterpolation?: boolean;
}
interface StateMachineConfig {
    /**
     * Controls whether and which URLs can be opened by a state machine.
     *
     * - requireUserInteraction: When true, URLs open only after an explicit user action
     *   (e.g., click/pointer down) on the animation.
     * - whitelist: List of allowed URL patterns. An empty list blocks all URLs. Use
     *   "*" to allow all URLs. Wildcards are supported in host and path (e.g.,
     *   "*.example.com/*").
     *
     * @example
     * ```typescript
     * // Require user interaction before opening any URL
     * openUrlPolicy: { requireUserInteraction: true, whitelist: ["*"] }
     *
     * // Block all URLs
     * openUrlPolicy: { whitelist: [] }
     *
     * // Allow all URLs
     * openUrlPolicy: { whitelist: ["*"] }
     *
     * // Allow a specific domain only
     * openUrlPolicy: { whitelist: ["https://example.com"] }
     *
     * // Allow subdomains and any path under lottiefiles.com
     * openUrlPolicy: { whitelist: ["*.lottiefiles.com/*"] }
     * ```
     *
     * By default, URLs are denied and require user interaction.
     */
    openUrlPolicy?: {
        requireUserInteraction?: boolean;
        whitelist?: string[];
    };
}
/**
 * dotLottie manifest containing metadata about available animations, themes, and state machines.
 * Included in .lottie files to describe the contents and relationships between components.
 */
interface Manifest {
    /**
     * List of animations available in this dotLottie file.
     * Each animation can have its own ID, themes, and background color.
     */
    animations: Array<{
        /** Background color for this animation */
        background?: string;
        /** Unique identifier for this animation */
        id: string;
        /** Default theme to apply when this animation loads */
        initialTheme?: string;
        /** List of theme IDs compatible with this animation */
        themes?: string[];
    }>;
    /** Tool or application that created this dotLottie file */
    generator?: string;
    /** List of available state machines for interactive behavior */
    stateMachines?: Array<{
        id: string;
    }>;
    /** List of available themes that can modify animation appearance */
    themes?: Array<{
        id: string;
    }>;
    /** dotLottie specification version */
    version?: string;
}
/**
 * Bezier easing handle for keyframe interpolation
 */
interface BezierHandle {
    x: number[];
    y: number[];
}
/**
 * Keyframe in Lottie native format
 * The value type (Color, Vector, number, etc.)
 */
interface Keyframe<T> {
    /** Hold keyframe - no interpolation to next keyframe */
    h?: 0 | 1;
    /** Incoming bezier handle (optional, for easing) */
    i?: BezierHandle;
    /** Outgoing bezier handle (optional, for easing) */
    o?: BezierHandle;
    /** Start value at this keyframe */
    s: T;
    /** Time (frame number) */
    t: number;
}
/**
 * Color as RGB or RGBA array with values normalized to [0, 1]
 * @example [1, 0, 0] // red
 * @example [1, 0, 0, 0.5] // red with 50% opacity
 */
type Color = [number, number, number] | [number, number, number, number];
/**
 * Color slot value - static color or array of keyframes
 * @example Static: [1, 0, 0, 1] // red
 * @example Animated: [\{ t: 0, s: [1, 0, 0, 1] \}, \{ t: 60, s: [0, 0, 1, 1] \}]
 */
type ColorSlotValue = Color | Array<Keyframe<Color>>;
/**
 * Scalar slot value - static number or array of keyframes (rotation, opacity, etc.)
 * @example Static: 45
 * @example Animated: [\{ t: 0, s: 0 \}, \{ t: 60, s: 360 \}]
 */
type ScalarSlotValue = number | Array<Keyframe<number>>;
/**
 * Vector as 2D or 3D point
 * @example [100, 100] // 2D vector
 * @example [100, 100, 0] // 3D vector
 */
type Vector = [number, number] | [number, number, number];
/**
 * Vector slot value - static vector or array of keyframes
 * Used for both "vector" and "position" slot types
 * @example Static: [100, 100]
 * @example Animated: [\{ t: 0, s: [0, 0] \}, \{ t: 60, s: [100, 100] \}]
 */
type VectorSlotValue = Vector | Array<Keyframe<Vector>>;
/**
 * Gradient as raw Lottie flat array format
 * Color stops: [offset, r, g, b, offset, r, g, b, ...]
 * With opacity: [...color stops, offset, opacity, offset, opacity, ...]
 * All values are in [0, 1] range
 * @example [0, 1, 0, 0, 1, 0, 0, 1] // red to blue gradient
 */
type Gradient = number[];
/**
 * Gradient slot value - static gradient or array of keyframes
 * @example Static: [0, 1, 0, 0, 1, 0, 0, 1]
 * @example Animated: [\{ t: 0, s: [0, 1, 0, 0, 1, 0, 0, 1] \}]
 */
type GradientSlotValue = Gradient | Array<Keyframe<Gradient>>;
/**
 * Text document properties
 * @see https://lottiefiles.github.io/lottie-docs/text/#text-document
 */
interface TextDocument {
    /** Font family */
    f?: string;
    /** Fill color [r, g, b] or [r, g, b, a] in [0, 1] range */
    fc?: Color;
    /** Justify: 0=left, 1=right, 2=center */
    j?: 0 | 1 | 2;
    /** Line height */
    lh?: number;
    /** Font size */
    s?: number;
    /** Stroke color [r, g, b] or [r, g, b, a] in [0, 1] range */
    sc?: Color;
    /** Stroke width */
    sw?: number;
    /** Text content (newlines encoded with carriage return) */
    t?: string;
    /** Tracking (letter spacing) */
    tr?: number;
}
/**
 * Text slot value - always static (text documents don't support animation)
 * @example \{ t: 'Hello', s: 24, fc: [0,0,0,1] \}
 */
type TextSlotValue = TextDocument;
/**
 * Slot type string as returned by the core
 */
type SlotType = 'color' | 'gradient' | 'image' | 'text' | 'scalar' | 'vector';

declare class DotLottie {
    private _canvas;
    private _pendingLoad;
    private _context;
    private readonly _eventManager;
    private _animationFrameId;
    private readonly _frameManager;
    private _dotLottieCore;
    private _stateMachineId;
    private _stateMachineConfig;
    private _isStateMachineRunning;
    private _stateMachineObserverHandle;
    private _stateMachineInternalMessageObserver;
    private _dotLottieObserverHandle;
    private static _wasmModule;
    private _renderConfig;
    private _isFrozen;
    private _backgroundColor;
    private _boundOnClick;
    private _boundOnPointerUp;
    private _boundOnPointerDown;
    private _boundOnPointerMove;
    private _boundOnPointerEnter;
    private _boundOnPointerLeave;
    private _bufferMismatchCount;
    private _lastExpectedBufferSize;
    /**
     * Creates a new DotLottie player instance for rendering Lottie animations.
     * Initializes the WASM module, event system, and loads animation if src or data is provided in config.
     * @param config - Configuration object specifying animation source, playback settings, and rendering options
     */
    constructor(config: Config);
    private _dispatchError;
    private _fetchData;
    private _loadFromData;
    private _loadFromSrc;
    /**
     * Gets the raw pixel buffer containing the rendered animation frame.
     * Returns RGBA pixel data as a Uint8Array for advanced image processing or custom rendering.
     */
    get buffer(): Uint8Array | null;
    /**
     * Gets the ID of the currently active animation from a multi-animation dotLottie file.
     * Returns undefined if no specific animation is active or for single-animation files.
     */
    get activeAnimationId(): string | undefined;
    /**
     * Gets the ID of the currently active theme applied to the animation.
     * Returns undefined if no theme is active. Themes modify colors and visual properties.
     */
    get activeThemeId(): string | undefined;
    /**
     * Gets the current layout configuration for positioning and scaling the animation.
     * Includes fit mode (contain, cover, fill, etc.) and alignment [x, y] values (0-1 range).
     */
    get layout(): Layout | undefined;
    /**
     * Gets the currently active marker name if a marker-based segment is set.
     * Returns undefined if no marker is active. Use setMarker() to activate a named segment.
     */
    get marker(): string | undefined;
    /**
     * Gets the animation manifest containing metadata about animations, themes, and states.
     * Returns null if no manifest is available or if the loaded animation doesn't include one.
     */
    get manifest(): Manifest | null;
    /**
     * Gets the current rendering configuration.
     * Includes settings like devicePixelRatio, autoResize, and freezeOnOffscreen.
     */
    get renderConfig(): RenderConfig;
    /**
     * Gets the currently active playback segment as [startFrame, endFrame].
     * If no segment is set, returns undefined and the full animation plays.
     */
    get segment(): [number, number] | undefined;
    /**
     * Gets the current loop configuration.
     * Returns true if the animation is set to loop continuously.
     */
    get loop(): boolean;
    /**
     * Gets the current playback mode.
     * Determines playback direction: 'forward', 'reverse', 'bounce' (forward then reverse), or 'reverse-bounce'.
     */
    get mode(): Mode;
    /**
     * Indicates whether rendering is currently frozen.
     * True when freeze() has been called and the rendering loop is paused to save resources.
     */
    get isFrozen(): boolean;
    /**
     * Indicates whether a state machine is currently active and running.
     * True after stateMachineStart() is called and until stateMachineStop() is called.
     */
    get isStateMachineRunning(): boolean;
    /**
     * Gets the current background color.
     * Returns the background color as a string (e.g., '#FFFFFF' or 'transparent').
     */
    get backgroundColor(): string;
    /**
     * Gets the autoplay configuration.
     * Returns true if the animation is configured to start playing automatically when loaded.
     */
    get autoplay(): boolean;
    /**
     * Gets the frame interpolation setting.
     * Returns true if frame interpolation is enabled for smoother animation playback.
     */
    get useFrameInterpolation(): boolean;
    /**
     * Gets the current playback speed.
     * Returns the speed multiplier (1 = normal speed, 2 = double speed, 0.5 = half speed).
     */
    get speed(): number;
    /**
     * Indicates whether the WASM module and core player have been initialized.
     * Check this before performing operations that require the player to be ready.
     */
    get isReady(): boolean;
    /**
     * Indicates whether an animation has been successfully loaded and is ready for playback.
     * Check this before calling play() or other playback methods to ensure the animation is ready.
     */
    get isLoaded(): boolean;
    /**
     * Indicates whether the animation is currently playing.
     * True when animation is actively playing, false when paused, stopped, or not started.
     */
    get isPlaying(): boolean;
    /**
     * Indicates whether the animation is currently paused.
     * True when pause() has been called and animation is not playing or stopped.
     */
    get isPaused(): boolean;
    /**
     * Indicates whether the animation is currently stopped.
     * True when stop() has been called or animation hasn't started yet.
     */
    get isStopped(): boolean;
    /**
     * Gets the current frame number of the animation.
     * Useful for tracking playback position or implementing custom frame displays. Rounded to 2 decimal places.
     */
    get currentFrame(): number;
    /**
     * Gets the number of times the animation has completed a loop during the current playback.
     * Increments each time the animation completes one full cycle.
     */
    get loopCount(): number;
    /**
     * Gets the total number of frames in the animation.
     * Use with currentFrame to calculate playback progress as a percentage.
     */
    get totalFrames(): number;
    /**
     * Gets the total duration of the animation in seconds.
     * Represents the time to play from the first frame to the last at normal speed (speed = 1).
     */
    get duration(): number;
    /**
     * Gets the duration of the currently active segment in seconds.
     * If no segment is set, returns the full animation duration.
     */
    get segmentDuration(): number;
    /**
     * Gets the canvas element used for rendering the animation.
     * Returns the HTMLCanvasElement, OffscreenCanvas, or RenderSurface set during initialization.
     */
    get canvas(): HTMLCanvasElement | OffscreenCanvas | RenderSurface | null;
    /**
     * Dynamically loads a new animation, replacing the current one if any.
     * Stops current playback, cleans up resources, and loads from the provided src or data.
     * @param config - Configuration for the new animation (all Config properties except canvas)
     */
    load(config: Omit<Config, 'canvas'>): void;
    private _draw;
    private _cleanupCanvas;
    private _initializeCanvas;
    private _stopAnimationLoop;
    private _startAnimationLoop;
    private _animationLoop;
    /**
     * Starts or resumes animation playback from the current frame.
     * Unfreezes rendering if frozen and starts the animation loop. Updates isPlaying state to true.
     */
    play(): void;
    /**
     * Pauses animation playback at the current frame.
     * Stops the animation loop while preserving the current frame position. Updates isPaused state to true.
     */
    pause(): void;
    /**
     * Stops animation playback and resets to the start frame.
     * Halts the animation loop and returns to the beginning. Updates isStopped state to true.
     */
    stop(): void;
    /**
     * Seeks to a specific frame in the animation and renders it.
     * Useful for implementing custom scrubbing controls or precise frame positioning.
     * @param frame - The target frame number to seek to
     */
    setFrame(frame: number): void;
    /**
     * Changes the animation playback speed.
     * Values above 1 speed up playback, below 1 slow it down.
     * @param speed - Playback speed multiplier (e.g., 2 for 2x speed, 0.5 for half speed)
     */
    setSpeed(speed: number): void;
    /**
     * Changes the background color of the canvas or animation.
     * For HTMLCanvasElement, sets the CSS background. For other surfaces, renders behind the animation.
     * @param color - CSS color string (e.g., '#FFFFFF', 'rgba(0,0,0,0.5)', 'transparent')
     */
    setBackgroundColor(color: string): void;
    /**
     * Enables or disables continuous looping of the animation.
     * When enabled with loopCount set to 0, animation repeats indefinitely.
     * @param loop - True to enable looping, false to play once
     */
    setLoop(loop: boolean): void;
    /**
     * Sets the number of additional times to replay the animation after the first play.
     * Requires loop to be true. A value of 0 means infinite replays; a positive value n means
     * the animation plays a total of n + 1 times (initial play + n replays).
     * @param loopCount - Number of additional replays (0 = infinite, 1 = plays twice, 2 = plays three times, etc.)
     */
    setLoopCount(loopCount: number): void;
    /**
     * Enables or disables frame interpolation for smoother playback.
     * When enabled, interpolates between frames. When disabled, shows exact frame-by-frame animation.
     * @param useFrameInterpolation - True for smooth interpolation, false for exact frames
     */
    setUseFrameInterpolation(useFrameInterpolation: boolean): void;
    /**
     * Subscribes to animation events like play, pause, frame, complete, etc.
     * Use this to react to animation state changes and playback progress.
     * @param type - Event type to listen for (e.g., 'play', 'frame', 'complete')
     * @param listener - Callback function invoked when the event occurs
     */
    addEventListener<T extends EventType>(type: T, listener: EventListener<T>): void;
    /**
     * Unsubscribes from animation events.
     * If no listener is provided, removes all listeners for the given event type.
     * @param type - Event type to stop listening for
     * @param listener - Specific callback to remove, or undefined to remove all
     */
    removeEventListener<T extends EventType>(type: T, listener?: EventListener<T>): void;
    /**
     * Cleans up and destroys the player instance, releasing all resources.
     * Stops playback, removes event listeners, and frees WASM memory. Call when the player is no longer needed.
     */
    destroy(): void;
    /**
     * Pauses the rendering loop without changing playback state.
     * Useful for reducing CPU/GPU usage when the animation is offscreen or hidden. Dispatches 'freeze' event.
     */
    freeze(): void;
    /**
     * Resumes the rendering loop after being frozen.
     * Restarts frame rendering while maintaining the current playback state. Dispatches 'unfreeze' event.
     */
    unfreeze(): void;
    /**
     * Recalculates and updates canvas dimensions based on current size.
     * Call this when the canvas container size changes to maintain proper rendering. Usually handled by autoResize.
     */
    resize(): void;
    /**
     * Changes the canvas element used for rendering.
     * Useful for moving the animation to a different canvas without recreating the player instance.
     * @param canvas - New HTMLCanvasElement, OffscreenCanvas, or RenderSurface to render to
     */
    setCanvas(canvas: HTMLCanvasElement | OffscreenCanvas | RenderSurface): void;
    /**
     * Applies a 3x3 transformation matrix to the entire animation on the canvas.
     * Use this to translate, rotate, scale, or skew the animation rendering.
     * @param transform - 9-element array representing the transformation matrix in row-major order
     * @returns True if transformation was applied successfully, false otherwise
     */
    setTransform(transform: Transform): boolean;
    /**
     * Gets the 3x3 transformation matrix applied to the animation.
     * Returns a 9-element array representing affine transformations (translation, rotation, scale, skew).
     * @returns Transform array of 9 numbers, or undefined if not available
     */
    getTransform(): Transform | undefined;
    /**
     * Sets a frame range to play instead of the full animation.
     * Useful for playing specific sections or creating animation sequences from subsections.
     * @param startFrame - Starting frame number (inclusive)
     * @param endFrame - Ending frame number (inclusive)
     */
    setSegment(startFrame: number, endFrame: number): void;
    /**
     * Changes the playback direction mode.
     * Controls whether animation plays forward, in reverse, or alternates (bounce).
     * @param mode - Playback mode: 'forward', 'reverse', 'bounce', or 'reverse-bounce'
     */
    setMode(mode: Mode): void;
    /**
     * Updates rendering configuration like autoResize, devicePixelRatio, and freezeOnOffscreen.
     * Dynamically changes how the canvas behaves without reloading the animation.
     * @param config - Partial RenderConfig with properties to update
     */
    setRenderConfig(config: RenderConfig): void;
    /**
     * Switches to a different animation within a multi-animation dotLottie file.
     * Use this to load a different animation by its ID without creating a new player instance.
     * @param animationId - ID of the animation to load (must exist in the manifest)
     */
    loadAnimation(animationId: string): void;
    /**
     * Activates a named marker to play only that marked segment.
     * Markers define named sections within an animation. Use markers() to list available markers.
     * @param marker - Name of the marker to activate
     */
    setMarker(marker: string): void;
    /**
     * Gets all markers defined in the animation with their time and duration.
     * Markers represent named sections that can be played using setMarker().
     * @returns Array of marker objects with name, time, and duration properties
     */
    markers(): Marker[];
    /**
     * Applies a theme to the animation, modifying colors and visual properties.
     * Themes are predefined in the dotLottie manifest. Returns true if theme was successfully loaded.
     * @param themeId - ID of the theme to apply (must exist in manifest)
     * @returns True if theme loaded successfully, false otherwise
     */
    setTheme(themeId: string): boolean;
    /**
     * Removes the currently applied theme and restores original animation colors.
     * Use this to revert to the default appearance after applying a theme.
     * @returns True if theme was reset successfully, false otherwise
     */
    resetTheme(): boolean;
    /**
     * Applies a custom theme from raw theme data instead of manifest theme ID.
     * Useful for dynamically generated or user-created themes not in the manifest.
     * @param themeData - Theme data as a JSON string
     * @returns True if theme loaded successfully, false otherwise
     */
    setThemeData(themeData: string): boolean;
    /**
     * Sets multiple slot values at once for parameterized animations.
     * Slots allow runtime customization of colors, text, images, or other properties.
     * @param slots - Object mapping slot IDs to their values
     */
    setSlots(slots: Record<string, unknown>): void;
    /**
     * Check if value is an array of keyframes (has objects with 't' and 's' properties)
     */
    private _isKeyframeArray;
    /**
     * Get the current value (k) from a slot's animated property structure
     * @returns The slot's k value, or undefined if not found
     */
    private _getSlotValue;
    /**
     * Get all slot IDs in the animation
     * @returns Array of slot ID strings
     */
    getSlotIds(): string[];
    /**
     * Get the type of a slot
     * @param slotId - The slot ID to query
     * @returns The slot type ('color', 'gradient', 'text', 'scalar', 'vector', 'position', 'image') or undefined
     */
    getSlotType(slotId: string): SlotType | undefined;
    /**
     * Get the current value of a slot
     * @param slotId - The slot ID to query
     * @returns The parsed slot value or undefined if not found
     */
    getSlot(slotId: string): unknown;
    /**
     * Get all slots as an object with slot IDs as keys
     * @returns Object containing all slots, or empty object if not loaded
     * @example
     * const slots = dotLottie.getSlots();
     */
    getSlots(): Record<string, unknown>;
    /**
     * Set a color slot value
     * @param slotId - The slot ID to set
     * @param value - Static color [r, g, b, a] or array of keyframes
     * @returns true if successful
     * @example
     * // Static red color
     * dotLottie.setColorSlot('myColor', [1, 0, 0, 1]);
     * // Animated color (red to blue)
     * dotLottie.setColorSlot('myColor', [\{ t: 0, s: [1, 0, 0, 1] \}, \{ t: 60, s: [0, 0, 1, 1] \}]);
     */
    setColorSlot(slotId: string, value: ColorSlotValue): boolean;
    /**
     * Set a scalar slot value (single number like rotation, opacity)
     * @param slotId - The slot ID to set
     * @param value - Static number or array of keyframes
     * @returns true if successful
     * @example
     * // Static rotation
     * dotLottie.setScalarSlot('rotation', 45);
     * // Animated rotation
     * dotLottie.setScalarSlot('rotation', [\{ t: 0, s: 0 \}, \{ t: 60, s: 360 \}]);
     */
    setScalarSlot(slotId: string, value: ScalarSlotValue): boolean;
    /**
     * Set a vector slot value (2D or 3D point for position, scale, etc.)
     * Handles both "vector" and "position" slot types
     * @param slotId - The slot ID to set
     * @param value - Static vector [x, y] or array of keyframes
     * @returns true if successful
     * @example
     * // Static scale
     * dotLottie.setVectorSlot('scale', [150, 150]);
     * // Animated position
     * dotLottie.setVectorSlot('position', [\{ t: 0, s: [0, 0] \}, \{ t: 60, s: [100, 200] \}]);
     */
    setVectorSlot(slotId: string, value: VectorSlotValue): boolean;
    /**
     * Set a gradient slot value
     * @param slotId - The slot ID to set
     * @param value - Static gradient [offset, r, g, b, ...] or array of keyframes
     * @returns true if successful
     * @example
     * // Static red to blue gradient
     * dotLottie.setGradientSlot('myGradient', [0, 1, 0, 0, 1, 0, 0, 1]);
     * // Animated gradient
     * dotLottie.setGradientSlot('myGradient', [\{ t: 0, s: [0, 1, 0, 0, 1, 0, 0, 1] \}]);
     */
    setGradientSlot(slotId: string, value: GradientSlotValue): boolean;
    /**
     * Set a text slot value (always static - text documents don't support animation)
     * Supports partial updates - only provided properties will be changed, others inherit from existing value
     * @param slotId - The slot ID to set
     * @param value - Text document properties (partial allowed)
     * @returns true if successful
     * @example
     * // Set all properties
     * dotLottie.setTextSlot('title', \{ t: 'Hello World', s: 24, fc: [0, 0, 0, 1] \});
     * // Partial update - only change text, keep existing font size, color, etc.
     * dotLottie.setTextSlot('title', \{ t: 'New Text' \});
     */
    setTextSlot(slotId: string, value: TextSlotValue): boolean;
    /**
     * Reset a slot to its original value
     * @param slotId - The slot ID to reset
     * @returns true if successful
     */
    resetSlot(slotId: string): boolean;
    /**
     * Clear a slot's custom value
     * @param slotId - The slot ID to clear
     * @returns true if successful
     */
    clearSlot(slotId: string): boolean;
    /**
     * Reset all slots to their original values
     * @returns true if successful
     */
    resetSlots(): boolean;
    /**
     * Clear all slot custom values
     * @returns true if successful
     */
    clearSlots(): boolean;
    /**
     * Updates the layout configuration for positioning and scaling the animation.
     * Changes how the animation fits and aligns within the canvas without requiring a reload.
     * @param layout - New layout configuration with fit mode and alignment values
     */
    setLayout(layout: Layout): void;
    /**
     * Sets a custom viewport region for rendering a portion of the animation.
     * Defines a rectangular area to render, useful for implementing animation clipping or panning effects.
     * @param x - X coordinate of the viewport's top-left corner
     * @param y - Y coordinate of the viewport's top-left corner
     * @param width - Width of the viewport in pixels
     * @param height - Height of the viewport in pixels
     * @returns True if viewport was set successfully, false otherwise
     */
    setViewport(x: number, y: number, width: number, height: number): boolean;
    /**
     * Configures the URL for loading the WASM module.
     * Call this before creating any player instances to load the WASM from a custom CDN or local path.
     * @param url - URL pointing to the dotlottie WASM file
     */
    static setWasmUrl(url: string): void;
    /**
     * @experimental
     * Register a custom font for use in animations
     * @param fontName - The name of the font to register
     * @param fontSource - Either a URL string to fetch the font, or ArrayBuffer/Uint8Array of font data
     * @returns Promise<boolean> - true if registration succeeded, false otherwise
     */
    static registerFont(fontName: string, fontSource: string | ArrayBuffer | Uint8Array): Promise<boolean>;
    /**
     * @experimental
     * Animates smoothly to a specific frame over a duration using linear easing.
     * Creates a tween animation transitioning from the current frame to the target frame.
     * @param frame - Target frame number to tween to
     * @param duration - Duration of the tween animation in seconds
     * @returns True if tween started successfully, false otherwise
     */
    tween(frame: number, duration: number): boolean;
    /**
     * @experimental
     * Start a tween animation to a specific marker
     * @param marker - The marker name to tween to
     * @param duration - Duration of the tween animation in seconds
     * @returns true if tween was started successfully
     */
    tweenToMarker(marker: string, duration: number): boolean;
    /**
     * Gets the original dimensions of the animation as defined in the source file.
     * Returns width and height in pixels representing the animation's intrinsic size.
     * @returns Object with width and height properties in pixels
     */
    animationSize(): {
        height: number;
        width: number;
    };
    /**
     * Gets the Oriented Bounding Box (OBB) points of a layer by its name.
     * Returns 8 numbers representing 4 corner points (x,y) in clockwise order from top-left: [x0, y0, x1, y1, x2, y2, x3, y3].
     * @param layerName - Name of the layer to get bounds for
     * @returns Array of 8 numbers representing the bounding box corners, or undefined if layer not found
     */
    getLayerBoundingBox(layerName: string): number[] | undefined;
    /**
     * Converts theme data into Lottie slot format for dynamic content replacement.
     * Utility function for transforming theme definitions into slot-compatible data structures.
     * @param theme - Theme data as a JSON string
     * @param slots - Slot definitions as a JSON string
     * @returns Transformed slots data as a JSON string
     */
    static transformThemeToLottieSlots(theme: string, slots: string): string;
    private _setupStateMachineObservers;
    private _cleanupStateMachineObservers;
    /**
     * @experimental
     * Loads a state machine by its ID from the dotLottie manifest.
     * State machines enable interactive, event-driven animation behaviors.
     * @param stateMachineId - The ID of the state machine to load (must exist in manifest)
     * @returns True if the state machine was loaded successfully, false otherwise
     */
    stateMachineLoad(stateMachineId: string): boolean;
    /**
     * @experimental
     * Load a state machine from data string
     * @param stateMachineData - The state machine data as a string
     * @returns true if the state machine was loaded successfully
     */
    stateMachineLoadData(stateMachineData: string): boolean;
    /**
     * @experimental
     * Set the state machine config
     * @param config - The state machine config
     */
    stateMachineSetConfig(config: StateMachineConfig | null): void;
    /**
     * @experimental
     * Start the state machine
     * @returns true if the state machine was started successfully
     */
    stateMachineStart(): boolean;
    /**
     * @experimental
     * Stop the state machine
     * @returns true if the state machine was stopped successfully
     */
    stateMachineStop(): boolean;
    /**
     * @experimental
     * Get the current status of the state machine
     * @returns The current status of the state machine as a string
     */
    stateMachineGetStatus(): string;
    /**
     * @experimental
     * Get the current state of the state machine
     * @returns The current state of the state machine as a string
     */
    stateMachineGetCurrentState(): string;
    /**
     * @experimental
     * Get the active state machine ID
     * @returns The active state machine ID as a string
     */
    stateMachineGetActiveId(): string;
    /**
     * @experimental
     * Override the current state of the state machine
     * @param state - The state to override to
     * @param immediate - Whether to immediately transition to the state
     * @returns true if the state override was successful
     */
    stateMachineOverrideState(state: string, immediate?: boolean): boolean;
    /**
     * @experimental
     * Get a specific state machine by ID
     * @param stateMachineId - The ID of the state machine to get
     * @returns The state machine data as a string
     */
    stateMachineGet(stateMachineId: string): string;
    /**
     * @experimental
     * Get the list of state machine listeners
     * @returns Array of listener names
     */
    stateMachineGetListeners(): string[];
    /**
     * @experimental
     * Set a boolean input value for the state machine
     * @param name - The name of the boolean input
     * @param value - The boolean value to set
     */
    stateMachineSetBooleanInput(name: string, value: boolean): boolean;
    /**
     * @experimental
     * Set a numeric input value for the state machine
     * @param name - The name of the numeric input
     * @param value - The numeric value to set
     */
    stateMachineSetNumericInput(name: string, value: number): boolean;
    /**
     * @experimental
     * Set a string input value for the state machine
     * @param name - The name of the string input
     * @param value - The string value to set
     */
    stateMachineSetStringInput(name: string, value: string): boolean;
    /**
     * @experimental
     * Get a boolean input value from the state machine
     * @param name - The name of the boolean input
     * @returns The boolean value or undefined if not found
     */
    stateMachineGetBooleanInput(name: string): boolean | undefined;
    /**
     * @experimental
     * Get a numeric input value from the state machine
     * @param name - The name of the numeric input
     * @returns The numeric value or undefined if not found
     */
    stateMachineGetNumericInput(name: string): number | undefined;
    /**
     * @experimental
     * Get a string input value from the state machine
     * @param name - The name of the string input
     * @returns The string value or undefined if not found
     */
    stateMachineGetStringInput(name: string): string | undefined;
    /**
     * @experimental
     * Get all the inputs of the current state machine. Returns the key name, followed by it's type as a string.
     * @returns An array of input keys followed by it's type at n+1.
     */
    stateMachineGetInputs(): string[];
    /**
     * @experimental
     * Fire an event in the state machine
     * @param name - The name of the event to fire
     */
    stateMachineFireEvent(name: string): void;
    /**
     * @experimental
     * Post a click event to the state machine
     * @param x - The x coordinate of the click
     * @param y - The y coordinate of the click
     * @returns The event result or undefined
     */
    stateMachinePostClickEvent(x: number, y: number): void;
    /**
     * @experimental
     * Post a pointer up event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerUpEvent(x: number, y: number): void;
    /**
     * @experimental
     * Post a pointer down event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerDownEvent(x: number, y: number): void;
    /**
     * @experimental
     * Post a pointer move event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerMoveEvent(x: number, y: number): void;
    /**
     * @experimental
     * Post a pointer enter event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerEnterEvent(x: number, y: number): void;
    /**
     * @experimental
     * Post a pointer exit event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerExitEvent(x: number, y: number): void;
    private _onClick;
    private _onPointerUp;
    private _onPointerDown;
    private _onPointerMove;
    private _onPointerEnter;
    private _onPointerLeave;
    private _setupStateMachineListeners;
    private _cleanupStateMachineListeners;
}

interface DotLottieInstanceState {
    activeAnimationId: string | undefined;
    activeThemeId: string | undefined;
    autoplay: boolean;
    backgroundColor: string;
    currentFrame: number;
    duration: number;
    isFrozen: boolean;
    isLoaded: boolean;
    isPaused: boolean;
    isPlaying: boolean;
    isReady: boolean;
    isStopped: boolean;
    layout: Layout | undefined;
    loop: boolean;
    loopCount: number;
    manifest: Manifest | null;
    marker: string | undefined;
    markers: Marker[];
    mode: Mode;
    renderConfig: RenderConfig;
    segment: [number, number] | undefined;
    segmentDuration: number;
    speed: number;
    totalFrames: number;
    useFrameInterpolation: boolean;
}
/**
 * Worker-based DotLottie player that offloads animation processing to a Web Worker thread.
 * Use this for better performance when rendering multiple animations or to keep the main thread responsive.
 * All methods are async (return Promises) due to worker communication. Requires HTMLCanvasElement or OffscreenCanvas.
 */
declare class DotLottieWorker {
    private static readonly _workerManager;
    private readonly _eventManager;
    private readonly _id;
    private readonly _worker;
    private _canvas;
    private _dotLottieInstanceState;
    private static _wasmUrl;
    private _created;
    private _boundOnClick;
    private _boundOnPointerUp;
    private _boundOnPointerDown;
    private _boundOnPointerMove;
    private _boundOnPointerEnter;
    private _boundOnPointerLeave;
    private _pendingConfig;
    /**
     * Creates a worker-based DotLottie player instance that runs in a separate thread.
     * Use workerId to share a worker across multiple animations for better resource management.
     * @param config - Configuration with optional workerId to share worker threads
     * @throws Error if canvas is not HTMLCanvasElement or OffscreenCanvas
     */
    constructor(config: Config & {
        workerId?: string;
    });
    private _handleWorkerEvent;
    private _create;
    get loopCount(): number;
    get isLoaded(): boolean;
    get isPlaying(): boolean;
    get isPaused(): boolean;
    get isStopped(): boolean;
    get currentFrame(): number;
    get isFrozen(): boolean;
    get segmentDuration(): number;
    get totalFrames(): number;
    get segment(): [number, number] | undefined;
    get speed(): number;
    get duration(): number;
    get isReady(): boolean;
    get mode(): Mode;
    get canvas(): HTMLCanvasElement | OffscreenCanvas | null;
    /**
     * Sets the canvas element for rendering in the worker thread.
     * Cannot change canvas after worker instance is created with a different canvas.
     * @param canvas - HTMLCanvasElement or OffscreenCanvas to render to
     * @returns Promise that resolves when canvas has been set
     * @throws Error if canvas is not HTMLCanvasElement or OffscreenCanvas
     * @throws Error if trying to change canvas after instance is already created
     */
    setCanvas(canvas: HTMLCanvasElement | OffscreenCanvas): Promise<void>;
    get autoplay(): boolean;
    get backgroundColor(): string;
    get loop(): boolean;
    get useFrameInterpolation(): boolean;
    get renderConfig(): RenderConfig;
    get manifest(): Manifest | null;
    get activeAnimationId(): string | undefined;
    get marker(): string | undefined;
    get activeThemeId(): string | undefined;
    get layout(): Layout | undefined;
    /**
     * Starts or resumes animation playback in the worker thread.
     * Updates the internal playback state (e.g., isPlaying) to reflect that playback has started.
     * @returns Promise that resolves when playback has started and state has been updated
     */
    play(): Promise<void>;
    /**
     * Pauses animation playback in the worker thread.
     * Awaits worker response before resolving. Updates isPaused state to true.
     * @returns Promise that resolves when playback has paused
     */
    pause(): Promise<void>;
    /**
     * Stops animation playback and resets to start frame in the worker thread.
     * Awaits worker response before resolving. Updates isStopped state to true.
     * @returns Promise that resolves when playback has stopped
     */
    stop(): Promise<void>;
    /**
     * Changes the animation playback speed in the worker thread.
     * Awaits worker response before resolving.
     * @param speed - Playback speed multiplier (e.g., 2 for 2x speed, 0.5 for half speed)
     * @returns Promise that resolves when speed has been updated
     */
    setSpeed(speed: number): Promise<void>;
    setMode(mode: Mode): Promise<void>;
    setFrame(frame: number): Promise<void>;
    setSegment(start: number, end: number): Promise<void>;
    setRenderConfig(renderConfig: RenderConfig): Promise<void>;
    setUseFrameInterpolation(useFrameInterpolation: boolean): Promise<void>;
    setTheme(themeId: string): Promise<boolean>;
    /**
     * Dynamically loads a new animation in the worker thread, replacing the current one.
     * Awaits worker response before resolving. Stops current playback and cleans up resources.
     * @param config - Configuration for the new animation (all Config properties except canvas)
     * @returns Promise that resolves when animation has been loaded
     */
    load(config: Omit<Config, 'canvas'>): Promise<void>;
    setLoop(loop: boolean): Promise<void>;
    /**
     * Sets the number of additional times to replay the animation after the first play in the worker thread.
     * Requires loop to be true. A value of 0 means infinite replays; a positive value n means
     * the animation plays a total of n + 1 times (initial play + n replays).
     * @param loopCount - Number of additional replays (0 = infinite, 1 = plays twice, 2 = plays three times, etc.)
     * @returns Promise that resolves when loopCount has been updated
     */
    setLoopCount(loopCount: number): Promise<void>;
    /**
     * Recalculates and updates canvas dimensions in the worker thread.
     * Awaits worker response before resolving. Call when canvas container size changes.
     * @returns Promise that resolves when resize has completed
     */
    resize(): Promise<void>;
    /**
     * Cleans up and destroys the player instance in the worker thread, releasing resources.
     * Awaits worker response before resolving. Stops playback and removes event listeners.
     * @returns Promise that resolves when cleanup has completed
     */
    destroy(): Promise<void>;
    freeze(): Promise<void>;
    unfreeze(): Promise<void>;
    setBackgroundColor(backgroundColor: string): Promise<void>;
    loadAnimation(animationId: string): Promise<void>;
    setLayout(layout: Layout): Promise<void>;
    private _updateDotLottieInstanceState;
    markers(): Marker[];
    setMarker(marker: string): Promise<void>;
    setThemeData(themeData: string): Promise<boolean>;
    setViewport(x: number, y: number, width: number, height: number): Promise<boolean>;
    animationSize(): Promise<{
        height: number;
        width: number;
    }>;
    /**
     * @experimental
     * Start a tween animation between two frame values with custom easing
     * @param frame - Starting frame value
     * @param duration - Duration of the tween in seconds
     * @returns true if tween was started successfully
     */
    tween(frame: number, duration: number): Promise<boolean>;
    /**
     * @experimental
     * Start a tween animation to a specific marker
     * @param marker - The marker name to tween to
     * @param duration - Duration of the tween in seconds
     * @returns true if tween was started successfully
     */
    tweenToMarker(marker: string, duration: number): Promise<boolean>;
    setTransform(transform: Transform): Promise<boolean>;
    getTransform(): Promise<Transform | undefined>;
    private _sendMessage;
    addEventListener<T extends EventType>(type: T, listener: EventListener<T>): void;
    removeEventListener<T extends EventType>(type: T, listener?: EventListener<T>): void;
    static setWasmUrl(url: string): void;
    /**
     * @experimental
     *
     * Register a custom font for use in animations in worker contexts
     * @param fontName - The name of the font to register
     * @param fontSource - Either a URL string to fetch the font, or ArrayBuffer/Uint8Array of font data
     * @returns Promise<boolean> - true if registration message was sent successfully
     */
    static registerFont(fontName: string, fontSource: string | ArrayBuffer | Uint8Array): Promise<boolean>;
    /**
     * @experimental
     * Load a state machine by ID
     * @param stateMachineId - The ID of the state machine to load
     * @returns true if the state machine was loaded successfully
     */
    stateMachineLoad(stateMachineId: string): Promise<boolean>;
    /**
     * @experimental
     * Load a state machine from data string
     * @param stateMachineData - The state machine data as a string
     * @returns true if the state machine was loaded successfully
     */
    stateMachineLoadData(stateMachineData: string): Promise<boolean>;
    /**
     * @experimental
     * Start the state machine
     * @returns true if the state machine was started successfully
     */
    stateMachineStart(): Promise<boolean>;
    /**
     * @experimental
     * Stop the state machine
     * @returns true if the state machine was stopped successfully
     */
    stateMachineStop(): Promise<boolean>;
    /**
     * @experimental
     * Set a numeric input value for the state machine
     * @param name - The name of the numeric input
     * @param value - The numeric value to set
     * @returns true if the input was set successfully
     */
    stateMachineSetNumericInput(name: string, value: number): Promise<boolean>;
    /**
     * @experimental
     * Set a boolean input value for the state machine
     * @param name - The name of the boolean input
     * @param value - The boolean value to set
     * @returns true if the input was set successfully
     */
    stateMachineSetBooleanInput(name: string, value: boolean): Promise<boolean>;
    /**
     * @experimental
     * Set the state machine config
     * @param config - The state machine config
     */
    stateMachineSetConfig(config: StateMachineConfig | null): Promise<void>;
    /**
     * @experimental
     * Set a string input value for the state machine
     * @param name - The name of the string input
     * @param value - The string value to set
     * @returns true if the input was set successfully
     */
    stateMachineSetStringInput(name: string, value: string): Promise<boolean>;
    /**
     * @experimental
     * Get a numeric input value from the state machine
     * @param name - The name of the numeric input
     * @returns The numeric value or undefined if not found
     */
    stateMachineGetNumericInput(name: string): Promise<number | undefined>;
    /**
     * @experimental
     * Get a boolean input value from the state machine
     * @param name - The name of the boolean input
     * @returns The boolean value or undefined if not found
     */
    stateMachineGetBooleanInput(name: string): Promise<boolean | undefined>;
    /**
     * @experimental
     * Get a string input value from the state machine
     * @param name - The name of the string input
     * @returns The string value or undefined if not found
     */
    stateMachineGetStringInput(name: string): Promise<string | undefined>;
    /**
     * @experimental
     * Get all inputs
     * @returns All input keys, followed by their type
     */
    stateMachineGetInputs(): Promise<string[] | undefined>;
    /**
     * @experimental
     * Fire an event in the state machine
     * @param name - The name of the event to fire
     */
    stateMachineFireEvent(name: string): Promise<void>;
    /**
     * @experimental
     * Get the current status of the state machine
     * @returns The current status of the state machine as a string
     */
    stateMachineGetStatus(): Promise<string>;
    /**
     * @experimental
     * Get the current state of the state machine
     * @returns The current state of the state machine as a string
     */
    stateMachineGetCurrentState(): Promise<string>;
    /**
     * @experimental
     * Get the active state machine ID
     * @returns The active state machine ID as a string
     */
    stateMachineGetActiveId(): Promise<string>;
    /**
     * @experimental
     * Override the current state of the state machine
     * @param state - The state to override to
     * @param immediate - Whether to immediately transition to the state
     * @returns true if the state override was successful
     */
    stateMachineOverrideState(state: string, immediate?: boolean): Promise<boolean>;
    /**
     * @experimental
     * Get a specific state machine by ID
     * @param stateMachineId - The ID of the state machine to get
     * @returns The state machine data as a string
     */
    stateMachineGet(stateMachineId: string): Promise<string>;
    /**
     * @experimental
     * Get the list of state machine listeners
     * @returns Array of listener names
     */
    stateMachineGetListeners(): Promise<string[]>;
    /**
     * @experimental
     * Post a click event to the state machine
     * @param x - The x coordinate of the click
     * @param y - The y coordinate of the click
     * @returns The event result or undefined
     */
    stateMachinePostClickEvent(x: number, y: number): Promise<void>;
    /**
     * @experimental
     * Post a pointer up event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerUpEvent(x: number, y: number): Promise<void>;
    /**
     * @experimental
     * Post a pointer down event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerDownEvent(x: number, y: number): Promise<void>;
    /**
     * @experimental
     * Post a pointer move event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerMoveEvent(x: number, y: number): Promise<void>;
    /**
     * @experimental
     * Post a pointer enter event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerEnterEvent(x: number, y: number): Promise<void>;
    /**
     * @experimental
     * Post a pointer exit event to the state machine
     * @param x - The x coordinate of the pointer
     * @param y - The y coordinate of the pointer
     * @returns The event result or undefined
     */
    stateMachinePostPointerExitEvent(x: number, y: number): Promise<void>;
    private _onClick;
    private _onPointerUp;
    private _onPointerDown;
    private _onPointerMove;
    private _onPointerEnter;
    private _onPointerLeave;
    private _setupStateMachineListeners;
    private _cleanupStateMachineListeners;
}

export { type BaseEvent, type BezierHandle, type Color, type ColorSlotValue, type CompleteEvent, type Config, type Data, type DestroyEvent, DotLottie, type DotLottieInstanceState, DotLottieWorker, type Event, type EventListener, EventManager, type EventType, type Fit, type FrameEvent, type FreezeEvent, type Gradient, type GradientSlotValue, type Keyframe, type Layout, type LoadErrorEvent, type LoadEvent, type LoopEvent, type Manifest, type Mode, type PauseEvent, type PlayEvent, type ReadyEvent, type RenderConfig, type RenderErrorEvent, type RenderEvent, type RenderSurface, type ScalarSlotValue, type SlotType, type StateMachineBooleanInputValueChangeEvent, type StateMachineConfig, type StateMachineCustomEvent, type StateMachineErrorEvent, type StateMachineInputFiredEvent, type StateMachineInternalMessage, type StateMachineNumericInputValueChangeEvent, type StateMachineStartEvent, type StateMachineStateEnteredEvent, type StateMachineStateExitEvent, type StateMachineStopEvent, type StateMachineStringInputValueChangeEvent, type StateMachineTransitionEvent, type StopEvent, type TextDocument, type TextSlotValue, type Transform, type UnfreezeEvent, type Vector, type VectorSlotValue };
