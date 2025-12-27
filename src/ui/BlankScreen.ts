
export class BlankScreen {
    private element: HTMLElement;
    private title: string;

    constructor(title: string) {
        this.title = title;
        this.element = document.createElement('div');
        this.initialize();
    }

    private initialize() {
        this.element.style.position = 'absolute';
        this.element.style.top = '0';
        this.element.style.left = '0';
        this.element.style.width = '100%';
        this.element.style.height = '100%';
        this.element.style.backgroundColor = 'rgba(0, 0, 0, 0.85)'; // Semi-transparent
        this.element.style.display = 'flex';
        this.element.style.justifyContent = 'center';
        this.element.style.alignItems = 'center';
        this.element.style.zIndex = '500'; // Below Header (1000) but above Scene

        const label = document.createElement('h1');
        label.innerText = this.title;
        label.style.color = '#333';
        label.style.fontFamily = 'sans-serif';
        label.style.fontSize = '3rem';
        label.style.fontWeight = 'bold';
        label.style.textTransform = 'uppercase';

        this.element.appendChild(label);
    }

    public getElement(): HTMLElement {
        return this.element;
    }
}
