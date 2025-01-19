declare class mermaid {
    static initialize(options?: Partial<MermaidOptions>):void
    static run():Promise<void>
}
interface MermaidOptions {
    startOnLoad: boolean
    theme: 'default' | 'base' | 'dark' | 'forest' | 'neutral' | 'null'
}