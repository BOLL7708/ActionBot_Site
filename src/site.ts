class Site {
    static _infoLeft: HTMLDivElement
    static _infoRight: HTMLDivElement
    static readonly PAGE_INFO = 0
    static readonly PAGE_LINKS = 1
    static readonly PAGE_README = 2
    static readonly PAGE_NOTES = 3
    static async run() {
        console.log('Site is running!')
        this._infoLeft = document.querySelector('.box.left') as HTMLDivElement
        this._infoRight = document.querySelector('.box.right') as HTMLDivElement
        this.setupButtons()
        await this.loadReleaseData()
        await this.loadReadMeData()
        return void 0
    }
    static setupButtons() {
        const containerInfo = document.querySelector('#info_container') as HTMLDivElement
        const containerLinks = document.querySelector('#links_container') as HTMLDivElement
        const containerReadMe = document.querySelector('#readme_container') as HTMLDivElement
        const containerNotes = document.querySelector('#notes_container') as HTMLDivElement
        containerNotes.style.display = 'none'
        containerLinks.style.display = 'none'

        const buttonInfo = document.querySelector('#info_button') as HTMLButtonElement
        const buttonLinks = document.querySelector('#links_button') as HTMLButtonElement
        const buttonReadMe = document.querySelector('#readme_button') as HTMLButtonElement
        const buttonNotes = document.querySelector('#notes_button') as HTMLButtonElement
        buttonInfo.onclick = (e) => {toggle(this.PAGE_INFO)}
        buttonLinks.onclick = (e) => {toggle(this.PAGE_LINKS)}
        buttonReadMe.onclick = (e) => {toggle(this.PAGE_README)}
        buttonNotes.onclick = (e) => {toggle(this.PAGE_NOTES)}
        function toggle(index: number) {
            toggleActive(buttonInfo, index == Site.PAGE_INFO)
            toggleActive(buttonLinks, index == Site.PAGE_LINKS)
            toggleActive(buttonReadMe, index == Site.PAGE_README)
            toggleActive(buttonNotes, index == Site.PAGE_NOTES)
            containerInfo.style.display = index == Site.PAGE_INFO ? 'block' : 'none'
            containerLinks.style.display = index == Site.PAGE_LINKS ? 'block' : 'none'
            containerReadMe.style.display = index == Site.PAGE_README ? 'block' : 'none'
            containerNotes.style.display = index == Site.PAGE_NOTES ? 'block' : 'none'
        }
        function toggleActive(button: HTMLButtonElement, on: boolean) {
            if(on) button.classList.add('active')
            else button.classList.remove('active')
        }
    }
    static async loadReadMeData() {
        const url = 'https://raw.githubusercontent.com/boll7708/desbot/master/README.md'
        const response = await fetch(url)
        const readme = document.querySelector('#readme_container') as HTMLDivElement
        if(response.ok) {
            const text = await response.text()
            const blocks = text.split(/^\s*---+\s*$/gm)
            console.log(readme, blocks)
            readme.innerHTML = blocks.map(block => { return `<div class="big box">${marked.parse(block)}</div>`}).join('')
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
                    this.setError(this._infoRight, message)
                }
            }
        } else {
            const message = 'Failed to load release data from GitHub'
            console.warn(message)
            if(!cached) {
                this.setError(this._infoLeft, message)
                this.setError(this._infoRight, message)
            }
        }
        return true
    }
    static updateBoxes(release: IRelease) {
        this.setInfo(this._infoLeft, [
            '<h2>Latest release</h2>',
            `Link: <a href="${release.html_url}">${release.tag_name}</a>`,
            `Title: ${release.name}`,
            'Date: '+new Date(release.published_at).toISOString().split('T')[0],
            'Pre-release: '+(release.prerelease ? 'Yes' : 'No'),
            `Source: <a href="${release.zipball_url}">.zip</a>, <a href="${release.tarball_url}">.tar</a>`
        ])
        this.setInfo(this._infoRight, [
            '<h2>Maintainer</h2>',
            `Profile: <a href="${release.author.html_url}">${release.author.login}</a>`
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
            return `<div class="big box"><h2>[<a href="${release.html_url}" target="_blank">${date}</a>] ${release.name}</h2>${marked.parse(release.body)}</div>`
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
