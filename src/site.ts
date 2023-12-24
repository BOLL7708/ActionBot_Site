class Site {
    static _infoLeft: HTMLDivElement
    static _infoRight: HTMLDivElement
    static async run() {
        console.log('Site is running!')
        this._infoLeft = document.querySelector('.box.left') as HTMLDivElement
        this._infoRight = document.querySelector('.box.right') as HTMLDivElement
        await this.loadReleaseData()
        return void 0
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
            `Profile: <a href="${release.author.html_url}">${release.author.login}</a> <img src="${release.author.avatar_url}" alt="Avatar" width="16" height="16">`
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
