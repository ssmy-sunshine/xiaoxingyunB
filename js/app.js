/*接口域名*/
var isConsole=true;//TODO 是否输出,正式项目需改为false
//var Host="http://www.yblbaby.net:800/";//测试项目服务器地址
//var HostWX="http://www.yblbaby.net:801/";//测试项目微信端接口地址
var Host="http://www.yblbaby.net:98/";//正式项目服务器地址
var HostWX="http://www.yblbaby.net/";//正式项目微信端接口地址,无端口
var HostDataQuery=Host+"DataInterface/WBAPP/WBAPPData_QueryV2.ashx";//无需登录的查询接口
var HostDataInV2=Host+"DataInterface/WBAPP/WBAPPData_INV2.ashx";//需登录的查询接口

/*分享链接*/
function getShareUrl(obj) {
	var shareUrl=HostWX+'wbwx/';
	var uid=UserObj.getUid();
	if(UserObj.isUserC()) uid=UserObj.getFatherUID()||1;//如果是C端用户分享的是邀请人的店铺
	obj=obj||{};
	if(obj.pid) {//分享商品
		shareUrl+='common/product.html?pid='+obj.pid+'&sid='+uid;
	}else if (obj.actId) {//分享活动
		shareUrl+='common/actCenter.html?actId='+obj.actId+'&sid='+uid;
	}else if (obj.groupId) {//分享团购
		shareUrl+='common/actGroupDetail.html?groupId='+obj.groupId+'&goodsId='+obj.goodsId+'&sid='+uid;
	}else if (obj.regin) {//邀请注册
		shareUrl+='common/regin.html?sid='+uid;
	}else{//没值则默认打开微信端首页
		shareUrl+='main/main.html?sid='+uid;
	}
	return shareUrl;
}

/*加载H5插件完成后的事件*/
document.addEventListener("plusready", function() {
	//返回按钮
	$(".wb-back").click(function(){ mui.back() });
	//跳转界面
	$(".tohref").click(function(){
		var needLogin=this.getAttribute("isLogin");
		if(needLogin&&!UserObj.isLogin()) return;//必须登录
		var href=this.getAttribute("href");
		var title=this.getAttribute("title");
		openWindow(href,title);
	})
	//android禁止侧滑返回,因为无法执行回调
	if(mui.os.android) plus.webview.currentWebview().setStyle({'popGesture': 'none'});
});

/*用户信息对象*/
var UserObj={
	/*获取本地缓存的用户Uid*/
	getUid : function() {
		var Uid=localStorage.getItem("Uid")||0;
		if (Uid) Uid=Number(Uid);
		return Uid;
	},
	setUid : function(Uid){
		setLocalStorage("Uid",Uid);
	},
	/*获取本地缓存的用户手机号*/
	getTel : function() {
		return localStorage.getItem("Mnum");
	},
	setTel : function(tel){
		setLocalStorage("Mnum",tel);
	},
	/*获取本地缓存的用户密码Md5*/
	getPassword : function() {
		return localStorage.getItem("pwMd5");
	},
	setPassword : function(pwMd5){
		setLocalStorage("pwMd5",pwMd5);
	},
	/*获取用户头像,如果传imgpath则返回拼接的头像地址,如果不传则返回当前用户的头像地址*/
	getIcon : function(imgpath) {
		if(imgpath){
			return getImgpath(imgpath);
		}else{
			return localStorage.getItem("UserIcon")||"";
		}
	},
	setIcon : function(imgpath){
		setLocalStorage("UserIcon",UserObj.getIcon(imgpath));
	},
	/*获取用户昵称*/
	getNickname : function() {
		return localStorage.getItem("UNickName");
	},
	setNickname : function(nickname) {
		setLocalStorage("UNickName",nickname);
	},
	/*获取用户注册时间*/
	getRegisTime : function() {
		return localStorage.getItem("RegisTime");
	},
	setRegisTime : function(regisTime) {
		setLocalStorage("RegisTime",regisTime);
	},
	/*获取用户会员等级: 0完成微信注册; 1注册手机号; 2选择礼包; 3已付款成店主*/
	getLevelTag : function() {
		return localStorage.getItem("RegisState");
	},
	setLevelTag : function(regisState) {
		setLocalStorage("RegisState",regisState);
	},
	getLevelName : function() {
		if(UserObj.isUserTest()){
			return "体验店主";
		}else{
			return localStorage.getItem("LevelName")||"普通用户";
		}
	},
	setLevelName : function(levelName) {
		setLocalStorage("LevelName",levelName);
	},
	/*是否C端用户*/
	isUserC : function() {
		return !UserObj.isUserTest()&&!UserObj.isUserReal();//不是原体验店主并且不是正式店主
	},
	/*是否B端用户*/
	isUserB : function() {
		return UserObj.isUserTest()||UserObj.isUserReal();//原体验店主或正式店主
	},
	/*是否为体验店主*/
	isUserTest : function() {
		//BC分离版本(3月31号)以前注册且在4月30号前都没付款的用户为体验店主
		var timeRegis=UserObj.getRegisTime();
		if(UserObj.isLogin(false)&&timeRegis&&!UserObj.isUserReal()&&getDateDiff("2017/03/31 00:00:00",timeRegis)>0&&getDateDiff("2017/04/30 00:00:00",UserObj.getSystemDate())>0){
			return true;
		}else{
			return false;
		}
	},
	/*是否为正式店主*/
	isUserReal : function() {
		return UserObj.isLogin(false)&&(UserObj.getLevelTag()==3);
	},
	/*缓存系统日期*/
	getSystemDate : function() {
		return localStorage.getItem("SystemDate");
	},
	setSystemDate : function(time) {
		setLocalStorage("SystemDate",time);
	},
	/*获取用户测试身份: 0普通用户,1测试人员;2开发人员;*/
	getTestTag : function() {
		return localStorage.getItem("USER_ISTEST");
	},
	setTestTag : function(type) {
		setLocalStorage("USER_ISTEST",type);
	},
	/*获取用户邀请人*/
	getFatherUID : function() {
		return localStorage.getItem("FatherUID");
	},
	setFatherUID : function(fatherUID) {
		setLocalStorage("FatherUID",fatherUID);
	},
	/*获取用户的店铺id*/
	getShopId : function() {
		return Number(localStorage.getItem("SHOP_ID")||1);
	},
	setShopId : function(shopid) {
		setLocalStorage("SHOP_ID",shopid);
	},
	/*获取用户的店铺id*/
	getShopCode : function() {
		return Number(localStorage.getItem("ShopCode")||1);
	},
	setShopCode : function(shopCode) {
		setLocalStorage("ShopCode",shopCode);
	},
	/*获取用户的店铺昵称*/
	getShopName : function() {
		return localStorage.getItem("SHOP_NAME");
	},
	setShopName : function(shopname) {
		setLocalStorage("SHOP_NAME",shopname);
	},
	/*获取用户的店铺背景图*/
	getShopImg : function() {
		return localStorage.getItem("SHOP_IMG");
	},
	setShopImg : function(shopimg) {
		setLocalStorage("SHOP_IMG",getImgpath(shopimg));
	},
	/*获取用户的店铺说明*/
	getShopTip : function() {
		return localStorage.getItem("SHOP_TIP")||"欢迎光临我的店铺~";
	},
	setShopTip : function(shoptip) {
		setLocalStorage("SHOP_TIP",shoptip||"欢迎光临我的店铺~");
	},
	/*获取用户登录的token*/
	getTK : function() {
		return localStorage.getItem("TK");
	},
	setTK : function(token) {
		setLocalStorage("TK",token);
	},
	/*获取用户是否登录 isToLogin默认跳转登录*/
	isLogin : function(isToLogin) {
		if (UserObj.getUid()&&UserObj.getTK()) {
			return true;
		} else{
			if(isToLogin!=false) openWindow("../account/login-tel.html");
			return false;
		}
	},
	/*账号密码登录*/
	login : function(tel,pwMd5,success,err,hideWait){
		tel = tel || UserObj.getTel();//手机号
		pwMd5 = pwMd5 || UserObj.getPassword();//密码Md5
		if (tel&&pwMd5) {
			ajaxData(Host+"DataInterface/WBAPP/WBAPPLogin.ashx", function(data) {
					//Y§2§7C68D95F90ACCB8E150BB55E18A3BA93
					//保存账户信息
					UserObj.setUid(data[1]);
					UserObj.setTK(data[2]);
					UserObj.setTel(tel);
					UserObj.setPassword(pwMd5);
					//获取用户其他基本信息
					UserObj.getUserinfo(function(isOk){
						//登录成功回调
						if(isOk){
							success&&success();
						} else{
							mui.toast("获取账户信息失败,请重新登录")
						}
					})
			},{Mnum:tel,pass:pwMd5},function(e) {
				//登录失败回调
				err&&err(e);
			},hideWait,false);
		}else{
			//如果没有传账号密码,则去登录页
			openWindow("../account/login-tel.html");
		}
	},
	/*获取用户信息*/
	getUserinfo : function(callback){
		if(!UserObj.isLogin(false)){
			callback&&callback();
			return;
		}
		var param={"IFID":12,"PR":[[],[],[],[],[],[]]};
		ajaxData(HostDataInV2, function(dataArr){
			//{"T0":[{"UNickName":"xjkjh","3782":"/Images/WBimg/usericon-max.png","3780":"xjkjh的店铺","3785":0.00,"3789":116,"3784":0,"ShopImg":"/Images/WBimg/ShopHead.jpg","ShopID":174741,"RegisState":1,"IsTestUser":0,"UserType":"闪店主"}],"T1":[{"todayProfit":0.00}],"T2":[{"todayOrder":0}],"T3":[{"jdlNum":0}],"T4":[{"jrtjNum":0}],"T5":[{"yqsNum":0}]}
			var data=JSON.parse(dataArr[2]);//设置用户信息
			var user=data["T0"][0];
			//先缓存变量,其他界面公用
			UserObj.setIcon(user["3782"]);//头像
			UserObj.setNickname(user.UNickName);//用户名
			UserObj.setShopId(user.ShopID);//店铺id
			UserObj.setShopCode(user.ShopCode);//店铺邀请码
			UserObj.setShopImg(user.ShopImg);//店铺背景
			UserObj.setShopName(user["3780"]);//店名
			UserObj.setRegisTime(user.RegisTime);//注册时间
			UserObj.setLevelTag(user.RegisState);//注册状态
			UserObj.setLevelName(user.UserType);//会员级别名称
			UserObj.setTestTag(user.IsTestUser);//是否为测试人员,在updateBiz.js用到
			UserObj.setFatherUID(user.FatherUID);//邀请注册的用户id
			UserObj.setSystemDate(dataArr[dataArr.length-1]);//服务器时间
			//回调
			callback&&callback(true);
			//更新用户最新活动时间
			ajaxData(HostDataInV2,null,{"IFID":11,"PR":[[UserObj.getUid()]]},null,true);
		},param,function(){
			callback&&callback();
		},true);
	}
}

/*设置localStorage,如果value不存在则移除*/
function setLocalStorage(key,value){
	if(value){
		localStorage.setItem(key,value);
	}else{
		localStorage.removeItem(key);
	}
}

/*拼接商品图片地址*/
function getImgpath(imgpath){
	if (imgpath&&imgpath.indexOf("http://")!=-1) {
		return imgpath;
	} else{
		return Host+imgpath;
	}
}

/*BC分离需要显示的界面*/
function showViewByBCuser(){
	var isLogin=UserObj.isLogin(false);
	if (isLogin&&UserObj.isUserReal()){
		//R已付款,正式店主
		$(".R-block").addClass("show-block");
		$(".R-inblock").addClass("show-inblock");
		$(".RT-block").addClass("show-block");
		$(".RT-inblock").addClass("show-inblock");
		$(".RC-inblock").addClass("show-inblock");
		$(".T-block").removeClass("show-block");
		$(".T-inblock").removeClass("show-inblock");
		$(".TC-inblock").removeClass("show-inblock");
		$(".C-block").removeClass("show-block");
		$(".C-inblock").removeClass("show-inblock");
	}else{
		//TC端用户或没有登录的用户
		$(".TC-inblock").addClass("show-inblock");
		$(".R-block").removeClass("show-block");
		$(".R-inblock").removeClass("show-inblock");
		if(isLogin&&UserObj.isUserTest()){
			//T原体验店主
			$(".RT-block").addClass("show-block");
			$(".RT-inblock").addClass("show-inblock");
			$(".T-block").addClass("show-block");
			$(".T-inblock").addClass("show-inblock");
			$(".RC-inblock").removeClass("show-inblock");
			$(".C-block").removeClass("show-block");
			$(".C-inblock").removeClass("show-inblock");
		}else{
			//C端用户或没有登录的用户
			$(".RT-block").removeClass("show-block");
			$(".RT-inblock").removeClass("show-inblock");
			$(".T-block").removeClass("show-block");
			$(".T-inblock").removeClass("show-inblock");
			$(".RC-inblock").addClass("show-inblock");
			$(".C-block").addClass("show-block");
			$(".C-inblock").addClass("show-inblock");
		}
	}
}

/**
 * 联网
 * url 网络地址
 * success 成功回调function(data)
 * param JSON参数 {key:value,key:value};默认带Uid和TK
 * err 错误回调
 * hideWait 不显示进度条(默认显示)
 * isParamKey 是否添加"param"这个key (默认添加)
 * paramJson 传参方式: 默认是flase,kv形式传参; true是json字符串形式传参;
 * dataJson 返回值类型: 默认是false,"§"解析的文本; true是标准的json字符串;
 */
function ajaxData(url,success,param,err,hideWait,isParamKey,paramJson,dataJson) {
	//统一带参
	param=param||{};
	param["Uid"]=UserObj.getUid();
	param["TK"]=UserObj.getTK();
	param["device"]=plus.device.model+" "+plus.os.version;//设备信息:iPhone 10.0.2; HUAWEI MT7-TL00 4.4.2
	param["IMEI"]=plus.device.uuid;//设备号  1.7.7版本开始带入
	param["version"]=localStorage.getItem("version");//版本号,在updateBiz.js中赋值; 1.5.5版本开始带入
	
	//无需登录状态的接口,需传key
	if (url==HostDataQuery) param["Key"]="PlA5W8K_2ER-36a3E-37RT_35sj2Y66_R_L";
	//isParamKey默认true,套一层param,参数格式为{param:jsonStr}
	if (isParamKey!=false&&!param.param) {
		param={"param":JSON.stringify(param)};
	}
	
	/*封装请求,便于重试*/
	function sendAjax(){
		//重试次数,默认3次
		if(!param.tryNum) param.tryNum=0;
		if(param.tryNum>=3) {
			mui.toast("请求超时,请重试. v"+param.version);
			return;
		}
		param.tryNum++;
		//显示进度条 默认显示hideWait==null或false
		if(!hideWait) showWaiting();
		//联网请求
		var paramData = paramJson ? JSON.stringify(param) : param;//JSON字符串传参
		mui.ajax(url,{
			data:paramData,
			type:'post',
			dataType:'text',//服务器返回的类型:文本
			timeout:10000,//10秒超时
			success:function(data){
				isConsole&&console.log("请求url--> " + url + " 参数--> " + JSON.stringify(param) + " 结果-->" + data);
				//请求数据
				var res={
					data:null,//真正的数据
					isExpireTK:false,//登录状态是否过期
					isErr:false,//是否报异常
					errMsg:""//异常信息
				};
				if(dataJson){
					// {"status":200,"msg":"success","data":0}
					res.data = JSON.parse(data);
					res.isExpireTK = (res.data.status==5001);
					res.isErr = (res.data.status!=200);
					if(res.isErr) res.errMsg = res.data.msg;
				}else{
					// Y/C/N§数据信息§DV2.0§0§2016/5/7 9:53:37
					res.data = data.split("§");
					res.isExpireTK = (res.data[0]=="C");
					res.isErr = (res.data[0]=="N");
					if(res.isErr) res.errMsg = res.data[1];
				}
				//关闭进度条
				if(!hideWait) plus.nativeUI.closeWaiting();
				//处理请求结果
				if (res.isExpireTK) {
					//token过期 自动登录刷token //C§token证书错误，请重新登陆！§WBAPPData_IN§0§2016/4/25 10:37:10
					if(!window.isGetTK){
						//一个界面只许刷一次token,避免多个请求同时刷token导致死循环
						window.isGetTK=true;
						UserObj.login(null,null,function() {
							//登录成功更新TK
							param.TK=UserObj.getTK();;
							if (param.param) {
								var paramObj=JSON.parse(param.param);
								paramObj.TK=param.TK;
								param.param=JSON.stringify(paramObj);
							}
							sendAjax();//登录成功继续请求
						},function (){
							window.isGetTK=false;
						});
					}else{
						//延时3秒刷新TK后,重新请求
						setTimeout(function(){
							//isGetTK=true;其他请求已刷过TK;则更新TK,继续请求,重新请求3次
							param.TK=UserObj.getTK();;
							if (param.param) {
								var paramObj=JSON.parse(param.param);
								paramObj.TK=param.TK;
								param.param=JSON.stringify(paramObj);
							}
							sendAjax();
						},3000)
					}
				} else if(res.isErr) {
					//N§异常信息§DV2.0§0§2016/5/7 9:53:37
					var noToastErr=err&&err(res.data);//错误回调 返回true则不提示异常
					if (noToastErr!=true) {
						mui.toast(res.errMsg+" v"+param.version);
					}
				} else{
					//请求成功回调;token不过期,无异常
					if(dataJson){
						success&&success(res.data.data,res.data);//直接返回真正的数据对象
					}else{
						success&&success(res.data);
					}
				}
			},
			error:function (xhr) {
				isConsole&&console.log("请求url--> " + url + " 参数--> " + JSON.stringify(param)+" 异常--> status=" + xhr.status+";statusText="+xhr.statusText);
				//关闭进度条
				if(!hideWait) plus.nativeUI.closeWaiting();
				//请求失败 特殊状态重新请求3次
				if(xhr.status==406||xhr.status==0){
					//延时1秒
					setTimeout(function(){
						sendAjax();
					},1000)
				}else{
					//错误回调 返回true则不提示异常
					var noToastErr=err&&err();
					if (noToastErr!=true) {
						mui.toast("网速不给力,请重试."+xhr.status+" v"+param.version);
					}
				}
			}
		});
	}
	//发送请求
	sendAjax();
}

/*获取json,参数param默认带TK和UID*/
function ajaxJson (url,success,param,err,hideWait) {
	//传参类型和返回数据类型都是json字符串
	ajaxData(url,success,param,err,hideWait,false,true,true);
}

/*显示进度条 modal是否禁止外部可按,默认true不可按*/
function showWaiting(hintText,modal) {
	modal = modal==null? true : false;
	plus.nativeUI.showWaiting(hintText||"请稍后...", {
		width: "50%",
		padding: "16px",
		modal:modal
	});
}

/*打开新界面
 *url: 界面路径;
 *title: 标题,传null则加载圆形返回键标题wb-head2,否则为常规返回标题wb-head1;详见temp.html;
 *param: 参数json格式 {key:value},接收则为var value=plus.webview.currentWebview().key;
 *isClose: 是否关闭当前页;
 */
function openWindow(url,title,param,isClose){
	url&&TempBiz.openWindow(url,title,param,isClose);
}
/*mui.openWindow*/
function muiOpenWindow(url,param,showWait,aniShow,isClose){
	//关闭本界面
	if (isClose) {
		var self=plus.webview.currentWebview();
		setTimeout(function () {
			self.hide("none");
			self.close("none");
		},1500)
	}
	//打开新界面
	mui.openWindow({
		url: url,
		id: url,
		extras: param||{},
		waiting:{
      		autoShow:showWait||false,
      		title:'正在加载...',
		    options:{
		        width:"50%"
		    }
    	},
		styles:{scrollIndicator:"none"},
		show: {aniShow: aniShow||"slide-in-right",duration: 400}
	})
}

/*创建界面,预加载*/
function preloadWindow(url,param,styles) {
	styles=styles||{};
	styles.scrollIndicator="none";
	var page = mui.preload({
	    url:url,
	    id:url,
	    styles:styles,
	    extras:param
	});
	return page;
}

/*显示界面,预加载*/
function showWindow(id_obj,anim,delay) {
	var win= typeof id_obj=="object" ? id_obj : plus.webview.getWebviewById(id_obj);
	if (win) {
		if (delay>0) {
			setTimeout(function () {
				win.show(anim||"pop-in",400);
			},delay);
		} else{
			win.show(anim||"pop-in",400);
		}
	}
}

/*加载图片
 *imgObj_id 图片dom对象或者id
 * 代码拼接的需此格式:
 *<img src="../img/loading-rect.png" data-src="网络地址" onload="loadimg(this)"/>
 * 直接调用则为:loadimg(imgDom,src);
 */
function loadimg(imgObj_id,src,callback){
	var imgDom = (typeof imgObj_id == "object") ? imgObj_id : document.getElementById(imgObj_id);
	if (imgDom) {
		var temp = new Image();
		temp.onload = function() {
			imgDom.onload = null;
			if (callback) {
				callback(imgDom,src);
			} else{
				imgDom.src = temp.src;
				imgDom.classList.add("anim_opacity"); //渐变动画
			}
		};
		temp.src = src||imgDom.getAttribute("data-src");
	}
}

/*数据为空的提示;
 *显示new EmptyBox().show();
 *隐藏new EmptyBox().hide();
 <div class="wb-empty-box">
	<img class="wb-empty-icon" src="../img/empty-icon.png"/>
	<p class="wb-empty-tip">提示内容</p>
	<p id="wb-empty-btn" class="wb-empty-btn">按钮</p>
</div>
 */
function EmptyBox(tip,btntext,btnCallback,src) {
	this.tip = tip==null ? "亲,暂无相关数据~" : tip;//默认提示:"亲,暂无相关数据~"
	this.btntext=btntext||"";
	this.btnCallback=btnCallback;
	this.src=src||"../img/empty-icon.png";
}
EmptyBox.prototype.show=function(id_obj,top) {
	var box = document.createElement("div");
	box.setAttribute("class", "wb-empty-box");
	box.innerHTML='<img class="wb-empty-icon" src="'+this.src+'"/><p class="wb-empty-tip">'+this.tip+'</p><p id="wb-empty-btn" class="wb-empty-btn">'+this.btntext+'</p>';
	if (id_obj) {
		var parent = typeof id_obj == "object" ? id_obj : document.getElementById(id_obj);
		parent.innerHTML="";
		parent.appendChild(box);
	} else{
		document.body.appendChild(box);
	}
	if(top) box.style.paddingTop=top;//默认是60px
	if (this.btntext) {//按钮
		var btn=document.getElementById("wb-empty-btn");
		if (btn) {
			btn.style.display="block";
			btn.addEventListener("tap",this.btnCallback);
		};
	}
}
EmptyBox.prototype.hide=function() {
	var boxs=document.getElementsByClassName("wb-empty-box");
	for (var i = 0; i < boxs.length; i++) {
		boxs[i].parentNode.removeChild(boxs[i]);
	}
}

/*遮罩
*标题wb-head 9910
*底部wb-footer 9900
*遮罩wb-shadow 9920
new Shadow(function() {
	//点击遮罩的事件...
	//关闭遮罩
	this.hide();
},9905).show()
 */
function Shadow(click,zIndex) {
	this.zIndex=zIndex;
	this.click=click;
}
Shadow.prototype.show=function() {
	if (document.getElementsByClassName("wb-shadow").length == 0) {
		var shadow = document.createElement("div");
		shadow.setAttribute("class", "wb-shadow");
		document.body.appendChild(shadow);
		if (this.zIndex) shadow.style.zIndex = this.zIndex;
		var self=this;
		shadow.onclick=function() {
			self.click&&self.click();
		}
	}
}
Shadow.prototype.hide=function() {
	var shadow=document.getElementsByClassName("wb-shadow");
	for (var i = 0; i < shadow.length; i++) {
		document.body.removeChild(shadow[i]);
	}
}

/*时间转换
 *type=1; 2013年11月06日 16:05:50
 *type=2; 2013年11月06日
 *type=3; 2013-11-06
 *type=4; 2013.11.06
 *type不传; 2013-11-06 16:05:50
 */
Date.prototype.formats = function(type) {
	var year = this.getFullYear();
	var month = this.getMonth() + 1;
	var d = this.getDate();
	var h = this.getHours();
	var m = this.getMinutes();
	var s = this.getSeconds();
	var add0 = function(num) {
		if (num < 10) {
			num = "0" + num;
		}
		return num;
	}
	if (type == 1) {
		return year + "年" + add0(month) + "月" + add0(d) + "日 " + add0(h) + ":" + add0(m) + ":" + add0(s);
	} else if (type == 2) {
		return year + "年" + add0(month) + "月" + add0(d) + "日";
	} else if(type == 3){
		return year + "-" + add0(month) + "-" + add0(d);
	} else if(type == 4){
		return year + "." + add0(month) + "." + add0(d);
	} else {
		return year + "-" + add0(month) + "-" + add0(d) + " " + add0(h) + ":" + add0(m) + ":" + add0(s);
	}
}
/*字符串时间转毫秒*/
function dateToMsec(str) {
	if(!str){
		return new Date().getTime();
	}else if(str.indexOf("Date")!=-1){
		// "\/Date(1476082500000+0800)\/"---->毫秒1476082500800 //dateStr = Date(1476082500000+0800)
		str.replace(/Date\([\d+]+\)/, function(dateStr) { eval('dateObj = new '+dateStr) });
		return dateObj.getTime();
	}else{
		// "2014/07/10 10:21:13"---->毫秒1404958873000
		return new Date(str).getTime();
	}
}
/*计算两个时间字符串相差的毫秒 (date1,date2时间字符串:2014/07/10 10:21:13)*/
function getDateDiff(date1,date2) {
	return dateToMsec(date1)-dateToMsec(date2);
}

/*给指定元素添加拨打电话的功能*/
function addTelHref(domId,tel){
	var domTel=document.getElementById(domId);
	if(domTel){
		domTel.addEventListener("tap",function () {
			//弹窗提示
			tel = tel || "4008871881";
			mui.confirm('亲,您有任何疑问或建议,欢迎致电联系我们:'+tel, '温馨提示', ['取消', '立即拨打'], function(e){
				if(e.index == 1){
					//如果tel没值,则默认平台的客服电话
                	window.location.href="tel:"+tel;
				}
            });
		})
	}
}

/*复制文本*/
function copyText(text,tip) {
	if(mui.os.android){
		  var Context = plus.android.importClass("android.content.Context");
		  var main = plus.android.runtimeMainActivity();
		  var clip = main.getSystemService(Context.CLIPBOARD_SERVICE);
		  plus.android.invoke(clip,"setText",text);
	}else if(mui.os.ios){
		//获取剪切板
		var UIPasteboard = plus.ios.importClass("UIPasteboard");
		var generalPasteboard = UIPasteboard.generalPasteboard();
		// 设置文本内容:
//		generalPasteboard.setValueforPasteboardType(text, "public.utf8-plain-text");//IOS10异常,需替换为下面两行代码
		generalPasteboard.plusCallMethod({setValue:text, forPasteboardType:"public.utf8-plain-text"});
 		generalPasteboard.plusCallMethod({valueForPasteboardType:"public.utf8-plain-text"});
	}
	mui.toast(tip||'复制成功');//其他异常暂不考虑
}

/*打开分享界面(标题,描述,链接,缩略图)*/
function openShare(title,content,thumbs,shareUrl){
	if(!UserObj.isLogin()) return;//必须登录
	isConsole&&console.log("title="+title+",content="+content+",thumbs="+thumbs+",shareUrl="+shareUrl);
	mui.openWindow({
		url: "../common/share.html",
		id: "../common/share.html",
		extras: {
		 	title : title,
		 	content : content,
		 	thumbs : thumbs,
		 	shareUrl : shareUrl
		},
		waiting: {autoShow: false},
		styles:{
			background:"transparent",
			scrollIndicator:"none"
		},
		show:{aniShow:"slide-in-bottom",duration: 300}
	});
}

/*导航切换,按钮变化
 *callback(i,dom)//点击导航按钮的回调,重复点击不回调,i当前点击的下标,this当前点击的dom元素
 *curTab 默认显示那个导航
 */
function initTabClick(parent,child,callback,curTab){
	var curTab=curTab||0;
	$(parent+" "+child).each(function(i,dom) {
		dom.setAttribute("i",i);
		//默认第一个变红
		if(i==curTab) dom.classList.add("tab-active");
	}).click(function() {
		//按钮变红
		var index=Number(this.getAttribute("i"));
		if (curTab!=index) {
			$(parent+" .tab-active").removeClass("tab-active");
			this.classList.add("tab-active");
			//执行回调
			callback&&callback(index,this,curTab);
			//标记
			curTab=index;
		}
	})
}

/*加入回到顶部的按钮,bottom离底部的距离,单位像素*/
function addTopBtn(bottom){
	var totopCls=document.getElementsByClassName("wb-totop");
	//未加入按钮,则加入
	if (totopCls.length==0) {
		var toTopBtn = document.createElement("div");
		toTopBtn.setAttribute("class", "iconfont icon-dingbu wb-totop");
		if(bottom) toTopBtn.style.bottom=bottom+"px";
		document.body.appendChild(toTopBtn);
		toTopBtn.onclick=function(){
			mui.scrollTo(0,300);
		}
	}
}

/*扩展数组方法：查找指定元素的下标*/
Array.prototype.indexOf = function(val) {
    for (var i = 0; i < this.length; i++) {
        if (this[i] == val) return i;
    }
    return -1;
}

/*扩展数组方法:删除指定元素*/
Array.prototype.remove = function(val) {
    var index = this.indexOf(val);
    while(index>-1){
        this.splice(index, 1);
        index = this.indexOf(val);
    }
}

/*如果有活动且没有结束(进行中或未开始)
 *1.则显示活动价SalePrice;否则显示特卖价price
 *2.则显示活动利润Profit;否则显示NoActProfit
 * 返回的数据{actIsEnd:false,profit:"5.00",price:"80.00"}
 */
function getActData(EndTime,systime,SalePrice,price,Profit,NoActProfit) {
	var actIsEnd=!EndTime||!systime||getDateDiff(systime, EndTime) > 0;//活动是否结束
	var actData={actIsEnd:actIsEnd};
	actData.price = (actIsEnd||!SalePrice) ? (price||0) : (SalePrice||0);
	actData.profit = actIsEnd ? (NoActProfit||0) : (Profit||0);
	return actData;
}

/*安卓双击退出程序*/
function doubleTapQuit(){
	if(mui.os.ios) return;
	//android首页返回键处理,处理逻辑：1秒内,连续两次按返回键，则退出应用
	var first = null;
	mui.back = function() {
		if (!first) {//首次按键，提示‘再按一次退出应用’
			first = (new Date()).getTime();
			mui.toast('再按一次退出应用');
			setTimeout(function() {
				first = null;
			}, 1000);
		} else {
			if ((new Date()).getTime() - first < 1000) {
				plus.runtime.quit();
			}
		}
	};
}

/*前端显示用户输入的地方都需调此方法(用户昵称,评论等),防止html,js注入*/
function removeHtmlTab(str){
	//方法一: 删除所有HTML标签
	return str.replace(/<[^<>]+?>/g,'*');
	//方法二: 转义html标签
//	var  entry = { "'": "&apos;", '"': '&quot;', '<': '&lt;', '>': '&gt;' };
//  return str.replace(/(['")-><&\\\/\.])/g, function ($0) { return entry[$0] || $0; });
}

/*获取 "¥128 / 赚 5"的HTML
 * <p class="userb-price-warp"><span class="userb-price monery">236</span><span class="grayline">/</span><span class="userb-profit-tip">赚</span><span class="userb-profit">5</span></p>*/
function getUserBPriceProfit(price,profit) {
	return '<p class="userb-price-warp"><span class="userb-price monery">'+price+'</span><span class="grayline">/</span><span class="userb-profit-tip">赚</span><span class="userb-profit">'+profit+'</span></p>';
}