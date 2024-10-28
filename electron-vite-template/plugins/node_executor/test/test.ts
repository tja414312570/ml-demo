declare var _channel: any;
type Wrapper = {
    func:(arg:string)=>void;
}
const wrrppaer:Wrapper = {
    func: (arg: string) => {
        return console.log('_channel', arg, _channel);
    }
}

const exec = (channel: string, fun: (wrp:Wrapper) => {} ) => {
    // 将 _channel 定义为局部变量
    const _channel = channel;
    fun(wrrppaer);
}
exec('xxx',wrapper=>({}) )
