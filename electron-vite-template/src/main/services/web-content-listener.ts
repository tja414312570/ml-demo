import { MapSet } from "@main/utils/MapSet";

const channels: MapSet<number> = new MapSet()
export const getWebContentIds = (channel: string): Set<number> => {
    return channels.get(channel);
}

export const getAllChannel = (): MapSet<number> => {
    return channels;
}

export const bindListenerChannel = (channel: string, webContentId: number) => {
    channels.add(channel, webContentId)
}
export const removeListenerChannel = (channel: string, webContentId: number) => {
    channels.remove(channel, webContentId)
}