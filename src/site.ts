export default class Site {
    static readonly PAGE_INFO = 'info'
    static readonly PAGE_LINKS = 'links'
    static readonly PAGE_README = 'readme'
    static readonly PAGE_NOTES = 'notes'
    _infoLeft: HTMLDivElement
    _logoGroup: HTMLDivElement
    _logoTop: HTMLImageElement
    _logoMiddle: HTMLImageElement
    _logoBottom: HTMLImageElement
    _infoRight: HTMLDivElement
    _containerInfo: HTMLDivElement
    _containerLinks: HTMLDivElement
    _containerReadMe: HTMLDivElement
    _containerNotes: HTMLDivElement
    _buttonInfo: HTMLButtonElement
    _buttonLinks: HTMLButtonElement
    _buttonReadMe: HTMLButtonElement
    _buttonNotes: HTMLButtonElement
    _footerYear: HTMLSpanElement
    _currentIndex: string
    _logoHeight: number

    async run() {
        console.log('Site is running!')

        this.initNavigation()
        this.setupElements()
        this.setupMermaid()
        await this.loadReleaseData()
        await this.loadReadMeData()
        return void 0
    }
    private setupElements() {
        this._containerInfo = document.querySelector('#info_container') as HTMLDivElement
        this._containerLinks = document.querySelector('#links_container') as HTMLDivElement
        this._containerReadMe = document.querySelector('#readme_container') as HTMLDivElement
        this._containerNotes = document.querySelector('#notes_container') as HTMLDivElement

        this._infoLeft = document.querySelector('.box.left') as HTMLDivElement
        this._logoGroup = document.querySelector('.logo-group') as HTMLDivElement
        this._logoTop = document.querySelector('#logo_top') as HTMLImageElement
        this._logoMiddle = document.querySelector('#logo_middle') as HTMLImageElement
        this._logoBottom = document.querySelector('#logo_bottom') as HTMLImageElement
        this._infoRight = document.querySelector('.box.right') as HTMLDivElement
        this._logoGroup.onmousemove = this.logoMouseOver.bind(this)
        this._logoGroup.onmouseover = this.logoMouseOver.bind(this)
        this._logoGroup.onmouseleave = this.logoMouseOver.bind(this)
        this._logoHeight = this._logoGroup.clientHeight

        this._buttonInfo = document.querySelector('#info_button') as HTMLButtonElement
        this._buttonLinks = document.querySelector('#links_button') as HTMLButtonElement
        this._buttonReadMe = document.querySelector('#readme_button') as HTMLButtonElement
        this._buttonNotes = document.querySelector('#notes_button') as HTMLButtonElement
        this._buttonInfo.onclick = (e) => {this.toggle(Site.PAGE_INFO)}
        this._buttonLinks.onclick = (e) => {this.toggle(Site.PAGE_LINKS)}
        this._buttonReadMe.onclick = (e) => {this.toggle(Site.PAGE_README)}
        this._buttonNotes.onclick = (e) => {this.toggle(Site.PAGE_NOTES)}
        this._footerYear = document.querySelector('#footer_year') as HTMLSpanElement
        this._footerYear.innerHTML = `${new Date().getFullYear()}`

        this.toggle(window.location.hash.substring(1))
    }

    private setupMermaid() {
        // Enable mermaid tagging in Marked
        marked.use({
            renderer: {
                code: function (code: {lang: string, text: string}) {
                    if (code.lang == 'mermaid') return `<pre class="mermaid">${code.text}</pre>`;
                    return `<pre>${code.text}</pre>`;
                }
            }
        })
        // Mermaid is not run on launch but after each load of Markdown documents.
        mermaid.initialize({
            startOnLoad: false,
            theme: 'dark'
        })
    }
    private async runMermaid() {
        await mermaid.run()
        const elements = document.querySelectorAll('.mermaid p')
        elements.forEach((el)=>{
            const text = el.innerHTML
            if(text.length) el.innerHTML = text.replace(/\\n/g, '<br/>')
        })
    }

    private toggle(index: string, skipHistory?: boolean) {
        const pages = [Site.PAGE_INFO, Site.PAGE_LINKS, Site.PAGE_README, Site.PAGE_NOTES]
        if(pages.indexOf(index) == -1) index = Site.PAGE_INFO
        if(this._currentIndex == index) return
        this._currentIndex = index
        if(!skipHistory) {
            console.log(`Navigating to: ${index}`)
            history.pushState({page: index}, index, '#'+index)
        }
        this.toggleActive(this._buttonInfo, index == Site.PAGE_INFO)
        this.toggleActive(this._buttonLinks, index == Site.PAGE_LINKS)
        this.toggleActive(this._buttonReadMe, index == Site.PAGE_README)
        this.toggleActive(this._buttonNotes, index == Site.PAGE_NOTES)
        this._containerInfo.style.display = index == Site.PAGE_INFO ? 'block' : 'none'
        this._containerLinks.style.display = index == Site.PAGE_LINKS ? 'block' : 'none'
        this._containerReadMe.style.display = index == Site.PAGE_README ? 'block' : 'none'
        this._containerNotes.style.display = index == Site.PAGE_NOTES ? 'block' : 'none'
    }
    private toggleActive(button: HTMLButtonElement, on: boolean) {
        if(on) {
            button.classList.add('active')
            // button.focus({ preventScroll: true }) // TODO: This didn't work anyway, still not sure how to solve the faulty highlight after navigating back on mobile.
        }
        else button.classList.remove('active')
    }

    private initNavigation() {
        window.onpopstate = (e) => {
            if(e.state && e.state.page) {
                console.log('Returning to: '+e.state.page)
                this.toggle(e.state.page, true)
            }
        }
    }
    private async loadReadMeData() {
        const url = 'https://raw.githubusercontent.com/boll7708/ActionBot/master/README.md'
        const response = await fetch(url)
        const readme = document.querySelector('#readme_container') as HTMLDivElement
        if(response.ok) {
            const text = await response.text()
            const html = marked.parse(text)
            const blocks = html.split(/^\s*<hr>\s*$/gm)
            readme.innerHTML = blocks.map(block => { return `<div class="big box">${block}</div>` }).join('')
        } else {
            readme.innerHTML = `<div class="big box"><p>Failed to load README.md from GitHub.</p>`
        }
        await this.runMermaid()
        return true
    }
    private async loadReleaseData() {
        const cached = this.getCachedResponse()
        if(cached) {
            console.log('Using cached release!')
            this.updateBoxes(cached)
        }
        const url = 'https://api.github.com/repos/boll7708/ActionBot/releases'
        const response = await fetch(url)
        if(response.ok) {
            const releases = await response.json() as IRelease[]
            if(releases) {
                this.updateNotes(releases)
                const latest = releases.reduce((a, b) => a.id > b.id ? a : b)
                this.setCachedResponse(latest)
                this.updateBoxes(latest)
            } else {
                const message = 'Failed to decode release data from GitHub'
                console.warn(message)
                if(!cached) {
                    this.setError(this._infoLeft, message)
                }
            }
        } else {
            const message = 'Failed to load release data from GitHub'
            console.warn(message)
            if(!cached) {
                this.setError(this._infoLeft, message)
            }
        }
        await this.runMermaid()
        return true
    }
    private updateBoxes(release: IRelease) {
        this.setInfo(this._infoLeft, [
            '<h2>Latest release</h2>',
            `<p>Link: <a href="${release.html_url}">${release.tag_name}</a></p>`,
            `<p>Title: ${release.name}</p>`,
            '<p>Date: '+new Date(release.published_at).toISOString().split('T')[0]+'</p>',
            '<p>Pre-release: '+(release.prerelease ? 'Yes' : 'No')+'</p>',
            `<p>Source: <a href="${release.zipball_url}">.zip</a>, <a href="${release.tarball_url}">.tar</a></p>`,
        ])
        this.setInfo(this._infoRight, [
            '<h2>Maintainer</h2>',
            `<img src="${release.author.avatar_url}" alt="Avatar" class="avatar">`,
            `<p>Profile: <a href="${release.author.html_url}">${release.author.login}</a></p>`,
        ])
    }
    private setInfo(info: HTMLDivElement, lines: string[]) {
        info.innerHTML = '<p>'+lines.join('<p/><p>')+'</p>'
    }
    private setError(element: HTMLDivElement, message?: string) {
        element.innerHTML = message ?? 'Failed to load release data from GitHub'
    }
    private setCachedResponse(release: IRelease) {
        localStorage.setItem('release', JSON.stringify(release))
    }
    private getCachedResponse(): IRelease|null {
        const text = localStorage.getItem('release')
        if(!text) return null
        return JSON.parse(text) as IRelease
    }
    private updateNotes(releases: IRelease[]) {
        const notes = document.querySelector('#notes_container') as HTMLDivElement
        notes.innerHTML = releases.map(release => {
            const date = new Date(release.published_at).toISOString().split('T')[0]
            return `<div class="big box">${date} <a href="${release.html_url}" target="_blank">${release.tag_name}</a> <strong>${release.name}</strong><hr/>${marked.parse(release.body)}</div>`
        }).join('')
    }

    private logoMouseOver(ev: MouseEvent) {
        switch(ev.type) {
            case 'mousemove':
                const y = ev.layerY
                const h = this._logoHeight
                if(y < h/3) {
                    this._logoTop.style.opacity = '0.5'
                    this._logoMiddle.style.opacity = '0'
                    this._logoBottom.style.opacity = '0'
                } else if(y > h/3 && y < h*2/3) {
                    this._logoTop.style.opacity = '0'
                    this._logoMiddle.style.opacity = '0.5'
                    this._logoBottom.style.opacity = '0'
                } else if(y > h*2/3) {
                    this._logoTop.style.opacity = '0'
                    this._logoMiddle.style.opacity = '0'
                    this._logoBottom.style.opacity = '0.5'
                }
                break
            case 'mouseover':
                this._logoTop.style.opacity = '0'
                this._logoMiddle.style.opacity = '0'
                this._logoBottom.style.opacity = '0'
                break
            case 'mouseleave':
                this._logoTop.style.opacity = ''
                this._logoMiddle.style.opacity = ''
                this._logoBottom.style.opacity = ''
                break
        }
    }
}

interface IRelease {
    assets: any[] // TODO: Unknown
    assets_url: string
    author: {
        avatar_url: string
        events_url: string
        followers_url: string
        following_url: string
        gists_url: string
        gravatar_id: string
        html_url: string
        id: number
        login: string
        node_id: string
        organizations_url: string
        received_events_url: string
        repos_url: string
        site_admin: boolean
        starred_url: string
        subscriptions_url: string
        type: string
        url: string
    }
    body: string
    created_at: string
    draft: boolean
    html_url: string
    id: number
    name: string
    node_id: string
    prerelease: boolean
    published_at: string
    tag_name: string
    tarball_url: string
    target_commitish: string
    upload_url: string
    url: string
    zipball_url: string
}
