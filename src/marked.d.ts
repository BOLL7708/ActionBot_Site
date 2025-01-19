declare class marked {
    static parse(text: string): string
    static use(options: Partial<MarkedOptions>): void
}
interface MarkedOptions {
    renderer: Partial<Renderer>
}
interface Renderer {
    code(code: Partial<Code>): string
}
interface Code {
    lang: string
    text: string
}