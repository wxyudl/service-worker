;(function(root, factory){
    root.hotWorker = factory();
})(this, function(){
    function HotWorker(){};

    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js', {
            scope: './'
        }).then(function (reg) {
            if (reg.installing) {
                console.log('Service worker installing');
            } else if (reg.waiting) {
                console.log('Service worker installed');
            } else if (reg.active) {
                console.log('Service worker active');
            }
        }).catch(function (error) {
            // registration failed
            console.log('Registration failed with ' + error);
        });
    }

    HotWorker.prototype.observer = function(cb, timer){
        setInterval(() => {
            var msg = new MessageChannel();
            // 一个端口用于发送消息，检查文件是否更新
            navigator.serviceWorker.controller.postMessage('observe', [msg.port2]);
            // 一个端口用于监听消息
            msg.port1.onmessage = function (e) {
                console.info('Files modified!');
                cb(e);
            }
        }, timer);
    };

    HotWorker.prototype.addFiles = function(...files){
        var msg = new MessageChannel();
        navigator.serviceWorker.controller.postMessage(files, [msg.port2]);
    };
    
    return new HotWorker();
});