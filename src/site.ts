class Site {
    static async run() {
        console.log('Site is running!')
        await this.loadReleaseData()
        return void 0
    }
    static async loadReleaseData() {
        const infoLeft = document.querySelector('.box.left') as HTMLDivElement
        const infoRight = document.querySelector('.box.right') as HTMLDivElement
        const url = 'https://api.github.com/repos/boll7708/desbot/releases'
        const response = await fetch(url)
        if(response.ok) {
            const releases = await response.json() as IRelease[]
            if(releases) {
                const latest = releases.reduce((a, b) => a.id > b.id ? a : b)
                this.setInfo(infoLeft, [
                    '<h2>Latest release</h2>',
                    `Link: <a href="${latest.html_url}">${latest.tag_name}</a>`,
                    `Title: ${latest.name}`,
                    'Date: '+new Date(latest.published_at).toISOString().split('T')[0],
                    'Pre-release: '+(latest.prerelease ? 'Yes' : 'No'),
                    `Source: <a href="${latest.zipball_url}">.zip</a>, <a href="${latest.tarball_url}">.tar</a>`
                ])
                this.setInfo(infoRight, [
                    '<h2>Maintainer</h2>',
                    `Profile: <a href="${latest.author.html_url}">${latest.author.login}</a> <img src="${latest.author.avatar_url}" alt="Avatar" width="16" height="16">`
                ])
            } else {
                const message = 'Failed to decode release data from GitHub'
                console.warn(message)
                this.setError(infoLeft, message)
                this.setError(infoRight, message)
            }
        } else {
            const message = 'Failed to load release data from GitHub'
            console.warn(message)
            this.setError(infoLeft, message)
            this.setError(infoRight, message)
        }
        return true
    }
    static setInfo(info: HTMLDivElement, lines: string[]) {
        info.innerHTML = '<p>'+lines.join('<p/><p>')+'</p>'
    }
    static setError(element: HTMLDivElement, message?: string) {
        element.innerHTML = message ?? 'Failed to load release data from GitHub'
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
