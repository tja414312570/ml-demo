export type ChannelMapType = { [key: string]: Array<number> };
const channels: ChannelMapType = {}
export const getWebContentIds = (channel: string) => {
    return channels[channel];
}

export const getAllChannel = (): ChannelMapType => {
    return channels;
}

export const bindListenerChannel = (channel: string, webContentId: number) => {
    if (!channels[channel]) {
        channels[channel] = [];
    }
    const index = channels[channel].findIndex(item => item === webContentId);
    if (index === -1) {
        channels[channel].push(webContentId)
    }
}
export const removeListenerChannel = (channel: string, webContentId: number) => {
    if (channels[channel]) {
        const index = channels[channel].findIndex(item => item === webContentId);
        if (index !== -1) {
            channels[channel].splice(index, 1);
        }
        if (channels[channel].length === 0) {
            delete channels[channel];
        }
    }
}