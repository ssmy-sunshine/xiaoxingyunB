/*差量逐级更新
new UpdateBiz(function(status){
	switch (status){
		case UpdateBiz.START_LOADING://关闭启动页,以显示下载进度
			document.getElementById("update-info").style.display="block";
			plus.navigator.closeSplashscreen();
			break;
		case UpdateBiz.SUCCESS:
			plus.runtime.restart();//更新成功重启程序
			break;
		case UpdateBiz.END:
			openPage();//最新版本或异常进入主页
			break;
	}
}).start();
 **/
function UpdateBiz(callback) {
	this.debug=false;//是否显示输出
	this.callback=callback;//回调更新状态
	UpdateBiz.END=0;//已是最新版本或者更新失败
	UpdateBiz.START_LOADING=1;//下载更新包
	UpdateBiz.LOADING=2;//下载进度
	UpdateBiz.SUCCESS=3;//更新成功
}

/*开始升级*/
UpdateBiz.prototype.start=function() {
	var self=this;
	//获取当前版本号
	plus.runtime.getProperty(plus.runtime.appid, function(inf) {
		//版本信息存入本地,在app.js联网请求获取
		localStorage.setItem("version",inf.version);
		//检查本地是否有新版本
		if(!self.insallLocVersion()){
			//本地无新版本,则获取服务器最新安装包信息
			self.getNewInfo(inf.version);
		}
	});
}

/*检查本地是否有新版本,有则安装*/
UpdateBiz.prototype.insallLocVersion=function(version) {
	var locV=localStorage.getItem("LocVersion");
	this.debug&&console.log("本地安装包=="+locV);
	if (locV){
		localStorage.removeItem("LocVersion");
		this.install(locV);
		return true;
	}else{
		return false;
	}
}

/*获取服务器最新安装包信息*/
UpdateBiz.prototype.getNewInfo=function(version) {
	var self=this;
	//参数[["1.0.1","0"]]}：版本号，设备 1 Android; 2 IOS;
	var de = mui.os.android ? "1" : "2";
	var param={"IFID":155,"PR":[[version,de]]};
	ajaxData(HostDataQuery,function(dataArr){
		//Y§1§[{"VersionNumber":"1.0.1","isInstall":0,"DownLink":"wb101-102.wgtu"}]§DV2.0§5§2016/6/1 12:07:46
		try{
			var data=JSON.parse(dataArr[2])[0];
			//isInstall:0强制android和ios更新;1强制Android更新;2强制IOS更新;3测试员更新;4下次启动更新;5开发人员更新
			var status=data.isInstall;
			var userTest=UserObj.getTestTag();//IFID":12 标记用户:0普通用户,1测试人员;2开发人员;
			if (status==0||(status==1&&mui.os.android)||(status==2&&mui.os.ios)||(status==3&&(userTest==1||userTest==2))||status==4||(status==5&&userTest==2)) {
				var newV=Number(data.VersionNumber.replace(".", ""));//1.0.1-->10.1
				var curV=Number(version.replace(".", ""));//1.0.0-->10
				if(newV>curV&&data.DownLink){
					var code = status==4 ? UpdateBiz.END : UpdateBiz.START_LOADING;//4下次启动更新,先静默下载
					self.callback&&self.callback(code,data.VersionNumber);//准备下载
					self.download("http://www.yblbaby.net/AppFile/"+data.DownLink, status);
					return;
				}
			}
		}catch(e){}
		self.callback&&self.callback(UpdateBiz.END);//更新失败的回调
	},param,function(){
		self.callback&&self.callback(UpdateBiz.END);//更新失败的回调
	},true);
}

/*下载更新包*/
UpdateBiz.prototype.download=function(loadUrl, isInstall) {
	var self=this;
	self.debug&&console.log("开始下载=="+loadUrl);
	//filename: "_doc/update/"，务必不要更改这个filename，否则会提示安装成功，但是版本号一直没有变，其实就是install找不到这个文件就无法更新了
	var dtask = plus.downloader.createDownload(loadUrl, {method: "GET",filename: "_doc/update/"},
		function(d, code) {
			var fname=d.filename;
			if(code == 200){
				self.debug&&console.log(isInstall+"==安装包下载成功=="+fname);
				if(isInstall==4){//下次安装
					localStorage.setItem("LocVersion",fname);
				}else{
					self.install(fname);
				}
			}else{
				self.debug&&console.log("安装包下载失败=="+fname);
				if(isInstall!=4) self.callback&&self.callback(UpdateBiz.END);//更新失败的回调
			}
		});
	//如果不是下次安装 则显示下载进度
	if(isInstall!=4){
		var curProgress=0;
		dtask.addEventListener("statechanged", function(task, status) {
            switch (task.state) {
                case 1: // 开始
                	self.debug&&console.log("开始下载...");
                    break;
                case 2: // 已连接到服务器
                    self.debug&&console.log("已连接到服务器");
                    break;
                case 3:
                    //每隔一定的比例显示一次
                    if (task.totalSize > 0) {
                        var progress = task.downloadedSize / task.totalSize * 100;
                        progress = Math.round(progress);
                        if (progress-curProgress>2) {
                        	curProgress=progress;
	                        self.callback&&self.callback(UpdateBiz.LOADING,"", progress);//更新进度
	                        self.debug&&console.log("下载进度=="+progress);
                        }
                    }
                    break;
                case 4: // 下载完成
                    self.debug&&console.log("下载完成100%");
                    break;
            }
        });
	}
    //启动
	dtask.start();
}

/*安装更新包*/
UpdateBiz.prototype.install=function(filename) {
	var self=this;
	self.debug&&console.log("开始安装=="+filename);
	//注意{force: true},务必写上这个参数, 强制安装
	plus.runtime.install(filename, {force: true}, function(info) {
		self.debug&&console.log("安装成功=="+filename);
		//删除安装包
		self.removeFile(filename,function () {
			self.callback&&self.callback(UpdateBiz.SUCCESS);//更新成功的回调
			//plus.runtime.restart();//重启程序 //如果不重启,除了升级的界面,其他未打开的界面都生效
		})
	}, function(e) {
		self.debug&&console.log("安装失败=="+JSON.stringify(e));
		self.removeFile(filename,function () {
			self.callback&&self.callback(UpdateBiz.END);//更新失败的回调
		})
	});
}

/*安装更新包*/
UpdateBiz.prototype.removeFile=function(filename,callback) {
	if (filename) {
		var self=this;
		plus.io.resolveLocalFileSystemURL(filename, function(entry) {
			entry.remove(function(entry) {
				self.debug&&console.log("文件删除成功==" + filename);
				callback&&callback();
			}, function(e) {
				self.debug&&console.log("文件删除失败=" + filename);
				callback&&callback();
			});
		});
	}
}

