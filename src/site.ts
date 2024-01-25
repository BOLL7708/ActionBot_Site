class Site {
    static _infoLeft: HTMLDivElement
    static readonly PAGE_INFO = 'info'
    static readonly PAGE_LINKS = 'links'
    static readonly PAGE_README = 'readme'
    static readonly PAGE_NOTES = 'notes'
    static _containerInfo: HTMLDivElement
    static _containerLinks: HTMLDivElement
    static _containerReadMe: HTMLDivElement
    static _containerNotes: HTMLDivElement
    static _buttonInfo: HTMLButtonElement
    static _buttonLinks: HTMLButtonElement
    static _buttonReadMe: HTMLButtonElement
    static _buttonNotes: HTMLButtonElement
    static _currentIndex: string

    static async run() {
        console.log('Site is running!')
        this._infoLeft = document.querySelector('.box.left') as HTMLDivElement
        this.initNavigation()
        this.setupButtons()
        await this.loadReleaseData()
        await this.loadReadMeData()
        return void 0
    }
    static setupButtons() {
        this._containerInfo = document.querySelector('#info_container') as HTMLDivElement
        this._containerLinks = document.querySelector('#links_container') as HTMLDivElement
        this._containerReadMe = document.querySelector('#readme_container') as HTMLDivElement
        this._containerNotes = document.querySelector('#notes_container') as HTMLDivElement

        this._buttonInfo = document.querySelector('#info_button') as HTMLButtonElement
        this._buttonLinks = document.querySelector('#links_button') as HTMLButtonElement
        this._buttonReadMe = document.querySelector('#readme_button') as HTMLButtonElement
        this._buttonNotes = document.querySelector('#notes_button') as HTMLButtonElement
        this._buttonInfo.onclick = (e) => {this.toggle(this.PAGE_INFO)}
        this._buttonLinks.onclick = (e) => {this.toggle(this.PAGE_LINKS)}
        this._buttonReadMe.onclick = (e) => {this.toggle(this.PAGE_README)}
        this._buttonNotes.onclick = (e) => {this.toggle(this.PAGE_NOTES)}
        
        this.toggle(window.location.hash.substring(1))
    }

    private static toggle(index: string, skipHistory?: boolean) {
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
    private static toggleActive(button: HTMLButtonElement, on: boolean) {
        if(on) button.classList.add('active')
        else button.classList.remove('active')
    }

    static initNavigation() {
        window.onpopstate = (e) => {
            if(e.state && e.state.page) {
                console.log('Returning to: '+e.state.page)
                this.toggle(e.state.page, true)
            }
        }
    }
    static async loadReadMeData() {
        const url = 'https://raw.githubusercontent.com/boll7708/desbot/master/README.md'
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
        return true
    }
    static async loadReleaseData() {
        const cached = this.getCachedResponse()
        if(cached) {
            console.log('Using cached release!')
            this.updateBoxes(cached)
        }
        const url = 'https://api.github.com/repos/boll7708/desbot/releases'
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
        return true
    }
    static updateBoxes(release: IRelease) {
        this.setInfo(this._infoLeft, [
            '<h2>Latest release</h2>',
            `<p>Link: <a href="${release.html_url}">${release.tag_name}</a></p>`,
            `<p>Title: ${release.name}</p>`,
            '<p>Date: '+new Date(release.published_at).toISOString().split('T')[0]+'</p>',
            '<p>Pre-release: '+(release.prerelease ? 'Yes' : 'No')+'</p>',
            `<p>Source: <a href="${release.zipball_url}">.zip</a>, <a href="${release.tarball_url}">.tar</a></p>`,
            '<h2>Maintainer</h2>',
            `<p>Profile: <a href="${release.author.html_url}">${release.author.login}</a></p>`,
        ])
    }
    static setInfo(info: HTMLDivElement, lines: string[]) {
        info.innerHTML = '<p>'+lines.join('<p/><p>')+'</p>'
    }
    static setError(element: HTMLDivElement, message?: string) {
        element.innerHTML = message ?? 'Failed to load release data from GitHub'
    }
    static setCachedResponse(release: IRelease) {
        localStorage.setItem('release', JSON.stringify(release))
    }
    static getCachedResponse(): IRelease|null {
        const text = localStorage.getItem('release')
        if(!text) return null
        return JSON.parse(text) as IRelease
    }
    static updateNotes(releases: IRelease[]) {
        const notes = document.querySelector('#notes_container') as HTMLDivElement
        notes.innerHTML = releases.map(release => {
            const date = new Date(release.published_at).toISOString().split('T')[0]
            return `<div class="big box"><h2><a href="${release.html_url}" target="_blank">${date}</a> &gt; ${release.name}</h2>${marked.parse(release.body)}</div>`
        }).join('')
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
