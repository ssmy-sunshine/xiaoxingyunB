/**
 * 模板管理类
 * 目的:解决webview切换卡顿,延时,白屏,闪屏的问题;
 * 原理:
 * 每打开一个界面就创建一个模板页,所有打开界面的方法都用模板页.loadURL来实现;
 * 关闭界面则隐藏当前页,在隐藏动画执行完后把当前页加载成模板页,并把本界面的模板页关闭
 * 
 * 使用方法:
 * 1.引入TempBiz.js
 * 2.打开新界面用TempBiz.openWindow(url,title,param)
 * 
 * 特别注意的地方:
 * 如果新打开的界面使用了预加载,比如mui.init({subpages:[url:xx,idxx]})或者mui.preloadPages,mui.preload,
 * 都需调用TempBiz.addSubPageId(xx);把预加载的界面添加进去,这样在关闭的时候TempBiz能把这些预加载的界面关闭;
 */
(function() {
	/*模板管理类的全局配置*/
	function TempWebviewBiz() {
		this.tempPath="../temp/temp.html";//模板界面存放的路径
		this.setTitleMethod="setHeader";//更新模板标题的方法名,与"../temp/temp.html"的必须一致;
		this.paramKey="tempParamKey";//webview传参的key
		this.tempIdPrefix="temp";//每个模板页id的前缀
		this.animIn="slide-in-right";//slide-in-right页面切进来的动画  //不用pop-in,因为标题会延时显示,返回按钮在动画执行时无法点击
		this.animOut="pop-out";//pop-out页面切出来的动画//不用slide-out-right,因为多图的界面会闪屏,白屏
		this.animDuration=400;//页面切换动画的持续时间
		this.subpages=[];//预加载的界面
	}
	
	/*打开新界面
	 *url: 界面路径
	 *title: 标题,传null则加载圆形返回键标题wb-head2,否则为常规返回标题wb-head1;详见temp.html;
	 *param: 参数json格式 {key:value},接收则为var value=plus.webview.currentWebview().key;
	 *isClose: 是否关闭当前页
	 */
	TempWebviewBiz.prototype.openWindow=function(url,title,param,isClose) {
		if (!url) return;
		var self=plus.webview.currentWebview();
		//获取当前模板页;
		var curTemp=this.getTempObj();
		//如果当前模板页为空,则创建
		if (!curTemp) curTemp=this.createCurTemp();
		//修改模板页标题;
		mui.fire(curTemp, this.setTitleMethod, {
			title: title
		});
		//模板页加载新界面,传参
	    if(param) url+=(url.indexOf("?")==-1 ? "?" : "&")+this.paramKey+"="+encodeURIComponent(JSON.stringify(param));
		//show模板页;
		curTemp.show(this.animIn, this.animDuration,function(){
	    	curTemp.loadURL(url);
	    	//关闭当前页
	    	isClose&&self.close("none");
		});
	}

	/*添加预加载的界面id
	 *界面中使用了以下方法,都需调本方法;用以关闭时同时关闭这些预加载的界面;
	 *mui.init({subpages:[url:xx,idxx]})或者mui.preloadPages,mui.preload的界面都需添加到这*/
	TempWebviewBiz.prototype.addSubPageId=function(id){
		this.subpages.push(id);
	}
	
	/*关闭预加载的界面
	 *每个预加载的界面mui都会直接createWindow,并创建模板页;
	 *界面关闭的时候要把这些预加载的界面和模板页都关闭
	 */
	TempWebviewBiz.prototype.closeSubPage=function(){
		var subpages=this.subpages;
		for (var i = 0; i < subpages.length; i++) {
			this.closeWindow(subpages[i]);
		}
	}

	/*关闭界面
	 * 1.先关闭界面的模板页
	 * 2.再关闭本界面
	 *id_obj 窗口id或对象,不传则本界面
	 *isCloseSelf 是否关闭本界面 默认关闭本界面
	 *aniClose 关闭的动画
	 */
	TempWebviewBiz.prototype.closeWindow=function(id_obj,isCloseSelf,aniClose){
		var win=this.getWinByIdOrObj(id_obj);
		if (win){
			//关闭界面的模板页
			var tempObj=this.getTempObj(win);
			tempObj&&tempObj.close("none");
			//关闭本界面 isCloseSelf==null或者ture都是关闭本界面
			if (isCloseSelf!=false) {
				win.close(aniClose||"none");
			}
		}
	}
	
	/*创建属于当前页的模板页*/
	TempWebviewBiz.prototype.createCurTemp=function(){
		var id=this.getTempId();
		var win = plus.webview.getWebviewById(id);
		//如果id重复,则关闭重新创建,避免展示出来的是加载过的模板页
		win&&win.close("none");
		//创建新的模板页
		return plus.webview.create(this.tempPath, id, {scrollIndicator:"none"});
	}
	
	/*获取目标webview的模板页obj
	 *id_obj不传则返回当前界面的模板页obj*/
	TempWebviewBiz.prototype.getTempObj=function(id_obj){
		var win=this.getWinByIdOrObj(id_obj);
		if (win){
			return plus.webview.getWebviewById(this.getTempId(win));
		}else{
			return null;
		}
	}
	
	/*获取指定webview的模板页Id
	 *如果id不传则获取当前页的模板页id*/
	TempWebviewBiz.prototype.getTempId=function(id_obj){
		var win=this.getWinByIdOrObj(id_obj);
		if (win){
			return this.tempIdPrefix+win.getURL();
		}else{
			return null;
		}
	}
	
	/*获取目标webview
	 *id_obj不传则返回当前界面obj*/
	TempWebviewBiz.prototype.getWinByIdOrObj=function(id_obj){
		var win;
		if (id_obj==null) {
			win=plus.webview.currentWebview();
		}else if(typeof id_obj=="object"){
			win=id_obj;
		}else{
			win=plus.webview.getWebviewById(id_obj);
		}
		return win;
	}
	
	/*获取地址参数,中文需encodeURIComponent编码,这里用decodeURIComponent解码*/
	TempWebviewBiz.prototype.getUrlParam=function(key){
		var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");
		var r = window.location.search.substr(1).match(reg);
		if (r != null) return decodeURIComponent(r[2]);
		return null;
	}
	
	//创建窗口管理对象
	window.TempBiz=new TempWebviewBiz();
	//创建属于本界面的模板页,用于本界面loadURL打开新界面
	mui.plusReady(function() {
		//把传来的参数存入webview中
		var param=TempBiz.getUrlParam(TempBiz.paramKey);
		if (param){
			param=JSON.parse(param);
			var self=plus.webview.currentWebview();
			for(key in param){
				self[key]=param[key];
			}
		}
		//创建属于本界面的模板页,用于本界面loadURL打开新界面
		TempBiz.createCurTemp();
		//返回逻辑
		var oldback = mui.back;
		mui.back = function (){
			//隐藏本界面
			plus.webview.currentWebview().hide(TempBiz.animOut,TempBiz.animDuration);
			//执行原来的关闭逻辑
			setTimeout(function() {
				//关闭本界面的模板页
			    TempBiz.closeWindow(null,false,"auto");
			    //关闭预加载的界面
			    TempBiz.closeSubPage();
				oldback();//此方法可把当前页的内容回退为模板页
//				console.log("关闭时的所有界面===\n"+getAllWebview());
			},TempBiz.animDuration);
		}
//		console.log("打开时的所有界面===\n"+getAllWebview());
	})
	
})()

////获取所有webview
//function getAllWebview() {
//	var wvres = "";
//	var wvs = plus.webview.all();
//	for (var i = 0; i < wvs.length; i++) {
//		wvres += wvs[i].id+"\n ";
//	}
//	return wvres;
//}