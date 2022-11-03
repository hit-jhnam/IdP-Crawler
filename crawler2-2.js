// Produced by Ji-Hyun Nam in 2020

const puppeteer = require('puppeteer');	// https://github.com/puppeteer/puppeteer
const cheerio = require('cheerio');

// 이벤트 리스너 제한 수정
process.setMaxListeners(500);

// target RP가 적힌 txt 파일을 읽어서 한페이지씩 접속
const targetListFileName = "D:/03 연구 - Token Revocation/AlexaTop10.txt";
const resultFileName = "D:/03 연구 - Token Revocation/Alexa_Test_Result2-2.txt";
const fs = require('fs');
const targetRps = fs.readFileSync(targetListFileName, 'utf-8').toString().split('\r\n');
fs.writeFileSync(resultFileName, "");

var index = 0;	// 코드 실행한 RP들의 index
const inputURLs = targetRps.length; // input으로 들어온 RP 개수

for (var i = 0; i < targetRps.length; i++) {
	//console.log(i);
	findIdPInMainPage(targetRps[i]).catch( () => {} );
}

// const: 재정의 되는 경우 에러 발생 + 값 변경 불가능
// let: 재정의 되는 경우 에러 발생 + 값 변경 가능
let linkRegexes = [/log[\s-_]?in/i, /login/i, /auth/i, /oauth/i, /signup/i, /sign[\s-_]?up/i, /signin/i, /sign[\s-_]?in/i, /signon/i, /sign[\s-_]?on/i, /register/i, /join/i, /logon/i, /log[\s-_]?on/i, /backstage/i, /passport/i, /account/i, /loggen/i, /connect/i, /sso/i];
let pageRegexes = [/pass/i, /user/i, /email/i, /id/i, /pw/i, /usr/i, /login/i];
let IdPRegexes = [/connect with/i, /로 연결/, /계정 로그인/, /로 계속/, /로 로그인/, /아이디 로그인/, /사용하여 로그인/, /로 가입/, /continue with/i, /sign with/i, /signup with/i, /sign[\s-_]?up with/i, /signin/i, /sign[\s-_]?in/i, /signin using/i, /sign[\s-_]?in using/i, /signon with/i, /sign[\s-_]?on with/i, /login via/i, /log[\s-_]?in via/i, /login with/i, /log[\s-_]?in with/i, /logon with/i, /log[\s-_]?on with/i, /Войти через/i, /entrar com/i, /\u3067\u30ed\u30b0\u30a4\u30f3/, /でログイン/];
let noIdPRegs = [/secure/i, /connect with us/i, /design/i, /username/i, /here/i, /sso/i, /otp/i, /issue/i, /trouble/i, /problem/i, /now/i, /무료/, /암호/, /전화번호/, /조직/, /click/i, /[+]/, /[.]/, /[?]/, /[|]/, /[/]/, /[,]/, /[:]/, /account/i, /provider/i, /your/i, /guest/i, /member/i, /backup/i, /\u5b9d\u6811/, /or/i, /pass/i, /without/i, /people/i, /different/i, /비밀번호로 로그인/, /다음/, /비공개로 로그인/, /모바일로 로그인/, /mobile/i, /또는/, /phone/i, /email/i, /이메일/, /방법/, /SAML/i, /\u65e0\u6cd5\u7528/, /Дневник/, /face[\s]?id/i, /touch[\s]?id/i, /\u5546\u57ce/, /\u624b\u673a/, /\u670b\u53cb/, /\u5173\u6ce8/];

let IdPList = [/facebook/i, /google/i, /twitter/i, /apple/i, /sina/i, /weibo/i, /qq/i, /wechat/i, /weixin/i, /vkontakte/i, /linkedin/i, /ok[.-_]ru/i, /okru/i, /yahoo/i, /mail[.-_]ru/i, /mailru/i, /amazon/i, /[^on][^air]line/i, /naver/i, /microsoft/i, /xbl/i, /alipay/i, /baidu/i, /kakao/i, /github/i, /instagram/i, /windows/i, /evernote/i, /tiktok/i, /nintendo/i, /renren/i, /pinterest/i, /slack/i, /civic/i, /twitch/i, /sberbank/i, /pgu[\s.-_]mou[\s.-_]ru/i, /livejournal/i, /stocktwits/i, /sony/i, /psn/i, /hizligiris/i, /douban/i, /battlenet/i, /steam/i, /163/i, /myvalue/i, /daftar/i, /snda/i, /Сбербанк/i, /Госуслуги/i, /shibboleth/i, /openathens/i, /telegram/i, /yy/i, /fanbyte/i, /taobao/i, /myvalue/i, /ocn/i, /verimi/i, /cmpay/i, /docomo/i, /clever/i, /bosspay/i, /firefox/i, /dingtalk/i, /wework/i, /t아이디/i, /payco/i];

// target RP에 대한 정보를 저장하는 구조체
function structMem(targetRp) {
	var rpName = targetRp; // target RP 이름
	var loginLinks = []; // 로그인 웹페이지 배열
	var getIdPs = []; // 로그인 페이지의 IdP 배열
}

// 메인페이지에서 IdP를 찾는 함수
async function findIdPInMainPage(targetRp) {
	console.log("findIdPInMainPage()");
	// target RP 구조체 선언
	var targetRpStruct = new Array();
	targetRpStruct[0] = new structMem();
	targetRpStruct[0].rpName = targetRp;
	targetRpStruct[0].loginLinks = [];
	targetRpStruct[0].getIdPs = [];
	//console.log(targetRpStruct[0]);

	const splitRpName = targetRpStruct[0].rpName.split(".");
	const ownId = splitRpName[0].toLowerCase();

	var errFlag = false;

	const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true});
	const page1 = await browser.newPage();
	await page1.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36');
	await page1.goto('http://'.concat(targetRpStruct[0].rpName.toLowerCase()), { waitUntil: 'networkidle0', timeout: 5000 })
		.catch( async function (error) {
			if (error.response) {
				// 요청이 이루어졌으며 서버가 2xx의 범위를 벗어나는 상태 코드로 응답
				++index;
				fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
				fs.appendFileSync(resultFileName, "\nMain page has error status: " + error.response.status + "\n");
				console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
				console.log("Main page has error status: " + error.response.status);
				errFlag = true;
			} else if (error.request) {
				// 요청이 이루어 졌으나 응답을 받지 못함
				++index;
				fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
				fs.appendFileSync(resultFileName, "\nMain page cannot get response\n");
				console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
				console.log("Main page cannot get response");
				errFlag = true;
			} else if ( error.message.indexOf("Navigation timeout") == 0 ) { // timeout 되는 경우 웹페이지 로드되면 페이지 가져옴
				await page1.goto('http://'.concat(targetRpStruct[0].rpName.toLowerCase()), { waitUntil: 'domcontentloaded', timeout: 5000 })
					.catch( (error) => {
						// 오류를 발생시킨 요청을 설정하는 중에 문제가 발생
						++index;
				fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
						fs.appendFileSync(resultFileName, "\nMain page occur error: " + error.message + "\n");
						console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
						console.log("Main page occur error: " + error.message);
						errFlag = true;
					}
				);
			} else {
				// 오류를 발생시킨 요청을 설정하는 중에 문제가 발생
				++index;
				fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
				fs.appendFileSync(resultFileName,"\nMain page occur error: " + error.message + "\n");
				console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
				console.log("Main page occur error: " + error.message);
				errFlag = true;
			}
		}
	);

	if (errFlag == true) {
		if (index == inputURLs) {
			closeBrowser(browser).catch( () => {} );
		}
		return;
	}

	let mainPage = await page1.content('utf-8').catch( () => {} ); // get full HTML content of the page
	let mainPageURL = page1.url();
	//console.log(mainPage);
	if (mainPage == undefined) {
		++index;
		fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
		fs.appendFileSync(resultFileName, "\nMain page is not loaded.\n");
		console.log("\n[%d] RP: " + targetRpStruct[0].rpName, ++index);
		console.log("Main page is not loaded");
		if (index == inputURLs) {
			closeBrowser(browser).catch( () => {} );
		}
		return;
	}
	getIdPFromText(targetRpStruct, browser, mainPage, ownId, "mainPage").then( async function (targetRpStruct) {
		// text와 link를 혼합 사용하는 웹페이지 존재
		getIdPFromLink(targetRpStruct, browser, mainPage, ownId).then( async function (targetRpStruct) {
			if (targetRpStruct[0].getIdPs.length == 0) {
				// 메인페이지에 IdP가 존재하지 않는 경우 웹페이지 파싱
				scanWebPage(targetRpStruct, browser, mainPage, ownId, mainPageURL).then( () => {return;} ).catch( () => {} );
			} else {
				// 메인페이지에 IdP가 존재하는 경우 출력
				++index;
				fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
				fs.appendFileSync(resultFileName, "\nIdP is on main page");
				fs.appendFileSync(resultFileName, "\nSSOIdP: " + targetRpStruct[0].getIdPs + "\n");
				console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
				console.log("IdP is on main page");
				console.log("SSOIdP: " + targetRpStruct[0].getIdPs);
				if (index == inputURLs) {
					closeBrowser(browser).catch( () => {} );
				}
				return;
			}
			// 메인페이지에서 식별 불가한 IdP가 로그인 페이지에 존재할 수도 있음 -> 무조건 다 뒤지기?
			//scanWebPage(targetRpStruct, browser, mainPage, ownId, mainPageURL).then( () => { return; } ).catch( () => {} );
		}).catch( () => {} );
	}).catch( () => {} );
}

// target page에서 Text로 IdP를 식별하는 함수
async function getIdPFromText(targetRpStruct, browser, targetPage, ownId, label) {
	console.log("getIdPFromText()");
	return new Promise( async function (resolve, reject) {
		if (label == "loginPage") {
			// 新浪 微博(sina weibo), 支付宝(alipay), 微信(wechat), 百度(baidu), 小米(xiaomi)
			IdPRegexes = IdPRegexes.concat(/qq/i, /\u5fae\u535a/i, /\u652f\u4ed8\u5b9d/i, /\u5fae\u4fe1/i, /\u767e\u5ea6/, /\u5c0f\u7c73/);
			//console.log(IdPRegexes);
		}
		const $ = cheerio.load(targetPage); // 웹페이지를 DOM 형태로 변환
		const $spanTags = $('span'); // span 태그만 추출
		const $aTags = $('a'); // a 태그만 추출
		const $btnTags = $('button'); //button 태그만 추출
		const $imgTags = $('img'); // img 태그만 추출
		
		//console.log("span: " + $spanTags.length);
		for (i = 0; i < $spanTags.length; i++) {
			const spanTag = cheerio($spanTags[i]);
			var spanText = spanTag.text();
			//console.log("spanText: " + spanText);
			if ( (spanText == undefined) || (spanText.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
				continue;
			}
			else if (spanText.toLowerCase().indexOf(ownId) != -1) {
				continue;
			}
			else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (spanText.indexOf("\u5fae\u535a") != -1) ) {
				continue;
			}
			else if ( (ownId == "alipay") && (spanText.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
				continue;
			}
			else if ( (ownId == "wechat") && (spanText.indexOf("\u5fae\u4fe1") != -1) ) {
				continue;
			}
			else if ( (ownId == "baidu") && (spanText.indexOf("\u767e\u5ea6") != -1) ) {
				continue;
			}
			else if ( (ownId == "xiaomi") && (spanText.indexOf("\u5c0f\u7c73") != -1) ) {
				continue;
			}
			//使用 ~~ 登入/登录
			else if ( (spanText.indexOf('\u4f7f\u7528') == 0) && ((spanText.lastIndexOf('\u767b\u5165') == spanText.length-2) || (spanText.lastIndexOf('\u767b\u5f55') == spanText.length-2)) ) {
				targetRpStruct[0].getIdPs.push(spanText);
				continue;
			}
			var FLAG1 = false;
			// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
			for (j = 0; j < noIdPRegs.length; j++) {
				if (spanText.match(noIdPRegs[j]) != null) {
					FLAG1 = true;
					break;
				}
				else if ( (FLAG1 == false) && (j == noIdPRegs.length - 1) ) {
					for (k = 0; k < IdPRegexes.length; k++) {
						var IdPRegexe = IdPRegexes[k].toString().split(['/']);
						var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
						if ( ( spanText.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
							break;
						}
						else if (spanText.match(IdPRegexes[k]) != null) {
							targetRpStruct[0].getIdPs.push(spanText);
							break;
						}
						else if (k == IdPRegexes.length - 1) {
							break;
						}
					}
				}
			}
		}

		for (i = 0; i < $spanTags.length; i++) {
			const spanTag = cheerio($spanTags[i]);
			var spanTitle = spanTag.attr('title');
			//console.log("spanTitle: " + spanTitle);
			if ( (spanTitle == undefined) || (spanTitle.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
				continue;
			}
			else if (spanTitle.toLowerCase().indexOf(ownId) != -1) {
				continue;
			}
			else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (spanTitle.indexOf("\u5fae\u535a") != -1) ) {
				continue;
			}
			else if ( (ownId == "alipay") && (spanTitle.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
				continue;
			}
			else if ( (ownId == "wechat") && (spanTitle.indexOf("\u5fae\u4fe1") != -1) ) {
				continue;
			}
			else if ( (ownId == "baidu") && (spanTitle.indexOf("\u767e\u5ea6") != -1) ) {
				continue;
			}
			else if ( (ownId == "xiaomi") && (spanTitle.indexOf("\u5c0f\u7c73") != -1) ) {
				continue;
			}
			//使用 ~~ 登入/登录
			else if ( (spanTitle.indexOf('\u4f7f\u7528') == 0) && ((spanTitle.lastIndexOf('\u767b\u5165') == spanTitle.length-2) || (spanTitle.lastIndexOf('\u767b\u5f55') == spanTitle.length-2)) ) {
				targetRpStruct[0].getIdPs.push(spanTitle);
				continue;
			}
			var FLAG11 = false;
			// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
			for (j = 0; j < noIdPRegs.length; j++) {
				if (spanTitle.match(noIdPRegs[j]) != null) {
					FLAG11 = true;
					break;
				} else if ( (FLAG11 == false) && (j == noIdPRegs.length - 1) ) {
					for (k = 0; k < IdPRegexes.length; k++) {
						var IdPRegexe = IdPRegexes[k].toString().split(['/']);
						var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
						if ( ( spanTitle.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
							break;
						}
						else if (spanTitle.match(IdPRegexes[k]) != null) {
							targetRpStruct[0].getIdPs.push(spanTitle);
							break;
						}
						else if (k == IdPRegexes.length - 1) {
							break;
						}
					}
				}
			}
		}
		//console.log("a: " + $aTags.length);
		for (i = 0; i < $aTags.length; i++) {
			var aTag = cheerio($aTags[i]);
			var aText = aTag.text();
			//console.log("aText: " + aText);
			if ( (aText == undefined) || (aText.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
				continue;
			}
			else if (aText.toLowerCase().indexOf(ownId) != -1) {
				continue;
			}
			else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (aText.indexOf("\u5fae\u535a") != -1) ) {
				continue;
			}
			else if ( (ownId == "alipay") && (aText.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
				continue;
			}
			else if ( (ownId == "wechat") && (aText.indexOf("\u5fae\u4fe1") != -1) ) {
				continue;
			}
			else if ( (ownId == "baidu") && (aText.indexOf("\u767e\u5ea6") != -1) ) {
				continue;
			}
			else if ( (ownId == "xiaomi") && (aText.indexOf("\u5c0f\u7c73") != -1) ) {
				continue;
			}
			else if ( (aText.indexOf('\u4f7f\u7528') == 0) && ((aText.lastIndexOf('\u767b\u5165') == aText.length-2) || (aText.lastIndexOf('\u767b\u5f55') == aText.length-2)) ) {
				targetRpStruct[0].getIdPs.push(aText);
				continue;
			}
			var FLAG2 = false;
			// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
			for (j = 0; j < noIdPRegs.length; j++) {
				if (aText.match(noIdPRegs[j]) != null) {
					FLAG2 = true;
					break;
				} else if ( (FLAG2 == false) && (j == noIdPRegs.length - 1) ) {
					for (k = 0; k < IdPRegexes.length; k++) {
						var IdPRegexe = IdPRegexes[k].toString().split(['/']);
						var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
						if (aText == "Sign In") {
						}
						if ( ( aText.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
							break;
						}
						else if (aText.match(IdPRegexes[k]) != null) {
							targetRpStruct[0].getIdPs.push(aText);
							break;
						}
						else if (k == IdPRegexes.length - 1) {
							break;
						}
					} 
				}
			}
		}

		for (i = 0; i < $aTags.length; i++) {
			var aTag = cheerio($aTags[i]);
			var aTitle = aTag.attr('title');
			//console.log("aTitle: " + aTitle);

			if ( (aTitle == undefined) || (aTitle.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
				continue;
			}
			else if (aTitle.toLowerCase().indexOf(ownId) != -1) {
				continue;
			}
			else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (aTitle.indexOf("\u5fae\u535a") != -1) ) {
				continue;
			}
			else if ( (ownId == "alipay") && (aTitle.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
				continue;
			}
			else if ( (ownId == "wechat") && (aTitle.indexOf("\u5fae\u4fe1") != -1) ) {
				continue;
			}
			else if ( (ownId == "baidu") && (aTitle.indexOf("\u767e\u5ea6") != -1) ) {
				continue;
			}
			else if ( (ownId == "xiaomi") && (aTitle.indexOf("\u5c0f\u7c73") != -1) ) {
				continue;
			}
			//console.log(aTitle);
			else if ( (aTitle.indexOf('\u4f7f\u7528') == 0) && ( (aTitle.lastIndexOf('\u767b\u5165') == aTitle.length-2) || (aTitle.lastIndexOf('\u767b\u5f55') == aTitle.length-2) ) ) {
				targetRpStruct[0].getIdPs.push(aTitle);
				continue;
			}
			var FLAG22 = false;
			// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
			for (j = 0; j < noIdPRegs.length; j++) {
				if (aTitle.match(noIdPRegs[j]) != null) {
					FLAG22 = true;
					break;
				} else if ( (FLAG22 == false) && (j == noIdPRegs.length - 1) ) {
					for (k = 0; k < IdPRegexes.length; k++) {
						var IdPRegexe = IdPRegexes[k].toString().split(['/']);
						var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
						if ( ( aTitle.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
							break;
						}
						else if (aTitle.match(IdPRegexes[k]) != null) {
							targetRpStruct[0].getIdPs.push(aTitle);
							break;
						}
						else if (k == IdPRegexes.length - 1) {
							break;
						}
					} 
				}
			}
		}
		//console.log("btn: " + $btnTags.length);
		for (i = 0; i < $btnTags.length; i++) {
			const btnTag = cheerio($btnTags[i]);
			var btnText = btnTag.text();
			//console.log("btnText: " + btnText);

			if ( (btnText == undefined) || (btnText.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
				continue;
			}
			else if (btnText.toLowerCase().indexOf(ownId) != -1) {
				continue;
			}
			else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (btnText.indexOf("\u5fae\u535a") != -1) ) {
				continue;
			}
			else if ( (ownId == "alipay") && (btnText.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
				continue;
			}
			else if ( (ownId == "wechat") && (btnText.indexOf("\u5fae\u4fe1") != -1) ) {
				continue;
			}
			else if ( (ownId == "baidu") && (btnText.indexOf("\u767e\u5ea6") != -1) ) {
				continue;
			}
			else if ( (ownId == "xiaomi") && (btnText.indexOf("\u5c0f\u7c73") != -1) ) {
				continue;
			}
			else if ( (btnText.indexOf('\u4f7f\u7528') == 0) && ((btnText.lastIndexOf('\u767b\u5165') == btnText.length-2) || (btnText.lastIndexOf('\u767b\u5f55') == btnText.length-2)) ) {
				targetRpStruct[0].getIdPs.push(btnText);
				continue;
			}
			var FLAG3 = false;
			// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
			for (j = 0; j < noIdPRegs.length; j++) {
				if (btnText.match(noIdPRegs[j]) != null) {
					FLAG3 = true;
					break;
				} else if ( (FLAG3 == false) && (j == noIdPRegs.length - 1) ) {
					for (k = 0; k < IdPRegexes.length; k++) {
						var IdPRegexe = IdPRegexes[k].toString().split(['/']);
						var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
						if ( ( btnText.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
							break;
						}
						else if (btnText.match(IdPRegexes[k]) != null) {
							targetRpStruct[0].getIdPs.push(btnText);
							break;
						}
						else if (k == IdPRegexes.length - 1) {
							break;
						}
					}
				}
			}
		}

		for (i = 0; i < $btnTags.length; i++) {
			const btnTag = cheerio($btnTags[i]);
			var btnId = btnTag.attr('id');
			//console.log("btnId: " + btnId);

			if ( (btnId == undefined) || (btnId.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
				continue;
			}
			else if (btnId.toLowerCase().indexOf(ownId) != -1) {
				continue;
			}
			else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (btnId.indexOf("\u5fae\u535a") != -1) ) {
				continue;
			}
			else if ( (ownId == "alipay") && (btnId.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
				continue;
			}
			else if ( (ownId == "wechat") && (btnId.indexOf("\u5fae\u4fe1") != -1) ) {
				continue;
			}
			else if ( (ownId == "baidu") && (btnId.indexOf("\u767e\u5ea6") != -1) ) {
				continue;
			}
			else if ( (ownId == "xiaomi") && (btnId.indexOf("\u5c0f\u7c73") != -1) ) {
				continue;
			}
			else if ( (btnId.indexOf('\u4f7f\u7528') == 0) && ((btnId.lastIndexOf('\u767b\u5165') == btnId.length-2) || (btnId.lastIndexOf('\u767b\u5f55') == btnId.length-2)) ) {
				targetRpStruct[0].getIdPs.push(btnId);
				continue;
			}
			var FLAG33 = false;
			// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
			for (j = 0; j < noIdPRegs.length; j++) {
				if (btnId.match(noIdPRegs[j]) != null) {
					FLAG33 = true;
					break;
				} else if ( (FLAG33 == false) && (j == noIdPRegs.length - 1) ) {
					for (k = 0; k < IdPRegexes.length; k++) {
						var IdPRegexe = IdPRegexes[k].toString().split(['/']);
						var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
						if ( ( btnId.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
							break;
						}
						else if (btnId.match(IdPRegexes[k]) != null) {
							targetRpStruct[0].getIdPs.push(btnId);
							break;
						}
						else if (k == IdPRegexes.length - 1) {
							break;
						}
					}
				}
			}
		}

		if (label == "loginPage") {
			for (i = 0; i < $imgTags.length; i++) {
				const imgTag = cheerio($imgTags[i]);
				var imgAlt = imgTag.attr('alt');
				//console.log("imgTitle: " + imgTitle);

				if ( (imgAlt == undefined) || (imgAlt.replace(/ /gi, "").replace(/\n/g, "") == "") ) {
					continue;
				}
				else if (imgAlt.toLowerCase().indexOf(ownId) != -1) {
					continue;
				}
				else if ( ( (ownId == "sina") || (ownId == "weibo") ) && (imgAlt.indexOf("\u5fae\u535a") != -1) ) {
					continue;
				}
				else if ( (ownId == "alipay") && (imgAlt.indexOf("\u652f\u4ed8\u5b9d") != -1) ) {
					continue;
				}
				else if ( (ownId == "wechat") && (imgAlt.indexOf("\u5fae\u4fe1") != -1) ) {
					continue;
				}
				else if ( (ownId == "baidu") && (imgAlt.indexOf("\u767e\u5ea6") != -1) ) {
					continue;
				}
				else if ( (ownId == "xiaomi") && (imgAlt.indexOf("\u5c0f\u7c73") != -1) ) {
					continue;
				}
				else if ( (imgAlt.indexOf('\u4f7f\u7528') == 0) && ( (imgAlt.lastIndexOf('\u767b\u5165') == imgAlt.length-2) || (imgAlt.lastIndexOf('\u767b\u5f55') == imgAlt.length-2) ) ) {
					targetRpStruct[0].getIdPs.push(imgAlt);
					continue;
				}
				var FLAG4 = false;
				// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
				for (j = 0; j < noIdPRegs.length; j++) {
					if (imgAlt.match(noIdPRegs[j]) != null) {
						FLAG4 = true;
						break;
					} else if ( (FLAG4 == false) && (j == noIdPRegs.length - 1) ) {
						for (k = 0; k < IdPRegexes.length; k++) {
							var IdPRegexe = IdPRegexes[k].toString().split(['/']);
							var IdPReg = IdPRegexe[1].replace(/[\s]/gi, "");
							if ( ( imgAlt.replace(/[\s]/gi, "").replace(/\n/g, "").replace(/[_]/gi, "").replace(/[+]/gi, "").replace(/[-]/gi, "").toLowerCase() == IdPReg ) ) {
								break;
							}
							else if (imgAlt.match(IdPRegexes[k]) != null) {
								targetRpStruct[0].getIdPs.push(imgAlt);
								break;
							}
							else if (k == IdPRegexes.length - 1) {
								break;
							}
						}
					}
				}
			}
		}

		targetRpStruct[0].getIdPs = Array.from(new Set(targetRpStruct[0].getIdPs)); // getIdPs 배열 중복제거
		//console.log(targetRpStruct[0]);
		resolve(targetRpStruct);
	});
}

// target page에서 link로 IdP를 식별하는 함수
async function getIdPFromLink(targetRpStruct, browser, targetPage, ownId) {
	console.log("getIdPFromLink()");
	return new Promise( async function (resolve, reject) {
		const $ = cheerio.load(targetPage); // 웹페이지를 DOM 형태로 변환
		const $aTags = $('a');
		//console.log($aTags.length);

		for (i = 0; i < $aTags.length; i++) {
			const aTag = cheerio($aTags[i]);
			var aHref = aTag.attr('href');
			if ( (aHref == undefined) || (aHref.replace(/ /gi, "").replace(/\n/g, "") == "") )  {
				continue;
			} else if (aHref.indexOf("intent") != -1) {
				continue;
			}
			//console.log(aHref);
			loop1: 
			for (j = 0; j < linkRegexes.length; j++) {
				for (k = 0; k < IdPList.length; k++) {
					// 웹사이트 이름이 IdP에 포함된 경우 제외하기 위함
					if (IdPList[k].toString().indexOf(ownId) != -1) {
						continue;
					} 
					else if ( ( (IdPList[k].toString().indexOf("weibo") != -1) && (ownId == "sina") ) || (IdPList[k].toString().indexOf("sina") != -1) && (ownId == "weibo") ) {
						// sina와 weibo는 동일 회사
						continue;
					}
					else if ( (aHref.match(linkRegexes[j]) != null) && (aHref.match(IdPList[k]) != null) ) {
						const parseIdP = IdPList[k].toString().split(['/']);
						targetRpStruct[0].getIdPs.push(parseIdP[1]);
						break loop1;
					}
				}
			}
		}

		targetRpStruct[0].getIdPs = Array.from(new Set(targetRpStruct[0].getIdPs)); // getIdPs 배열 중복제거
		//console.log(targetRpStruct[0]);
		resolve(targetRpStruct);
	});
}

// target RP에 접속하여 link를 추출하는 함수
async function scanWebPage(targetRpStruct, browser, mainPage, ownId, mainPageURL) {
	console.log("scanWebPage()");

	// 메인 페이지에 IdP가 없는 경우
	var candidateLinks = mainPage.split("\"");

	candidateLinks.forEach( async function(candidateLink) {
		var FLAG = 0;
		if (candidateLink.indexOf("\'") != -1) {
			FLAG = 1;
			candidateTmp1 = candidateLink.split("\'");
		}
		else {	candidateTmp1 = candidateLink;	}
		Array.from(candidateTmp1).forEach(async function(tmp1) {
			if (tmp1.indexOf(" ") != -1) {
				FLAG = 2;
				candidateTmp2 = tmp1.split(" ");
			}
			else {	candidateTmp2 = tmp1;	}
			Array.from(candidateTmp2).forEach(async function(tmp2) {
				if (tmp2.indexOf(",") != -1) {
					FLAG = 3;
					candidateTmp3 = tmp2.split(",");
				}
				else {	candidateTmp3 = tmp2;	}
				Array.from(candidateTmp3).forEach(async function(tmp3) {
					if (tmp3.indexOf("{") != -1) {
						FLAG = 4;
						candidateTmp4 = tmp3.split("{");
					}
					else {	candidateTmp4 = tmp3;	}
					Array.from(candidateTmp4).forEach(async function(tmp4) {
						if (tmp4.indexOf("}") != -1) {
							FLAG = 5;
							candidateTmp5 = tmp4.split("}");
						}
						else {	candidateTmp5 = tmp4;	}
					});
				});
			});
		});

		if (FLAG != 0) {
			var index = candidateLinks.indexOf(candidateLink);
			candidateLinks.splice(index, 1);
		}
		if (FLAG == 1) {
			candidateLinks = candidateLinks.concat(candidateTmp1);
		} else if (FLAG == 2) {
			candidateLinks = candidateLinks.concat(candidateTmp2);
		} else if (FLAG == 3) {
			candidateLinks = candidateLinks.concat(candidateTmp3);
		} else if (FLAG == 4) {
			candidateLinks = candidateLinks.concat(candidateTmp4);
		} else if (FLAG == 5) {
			candidateLinks = candidateLinks.concat(candidateTmp5);
		}
	});
	//console.log(candidateLinks);

	if ( candidateLinks.length == 0 ) { // 링크가 없는 경우
		clickLoginTag(targetRpStruct, browser, mainPageURL, ownId).then( async function (clickedPage) {
			getIdPFromText(targetRpStruct, browser, clickedPage, ownId, "mainPage").then( async function (targetRpStruct) {
				// text와 link를 혼합 사용하는 웹페이지 존재
				getIdPFromLink(targetRpStruct, browser, clickedPage, ownId).then( async function (targetRpStruct) {
					if (targetRpStruct[0].getIdPs.length == 0) {
						++index;
						fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
						fs.appendFileSync(resultFileName, "\nNo candidate link\n");
						console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
						console.log("No candidate link");
						if (index == inputURLs) {
							closeBrowser(browser).catch( () => {} );
						}
						return;
					} else {
						// 클릭한 페이지에 IdP가 존재하는 경우 출력
						++index;
						fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
						fs.appendFileSync(resultFileName, "\nIdP is on main page");
						fs.appendFileSync(resultFileName, "\nSSOIdP: " + targetRpStruct[0].getIdPs + "\n");
						console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
						console.log("IdP is on main page");
						console.log("SSOIdP: " + targetRpStruct[0].getIdPs);
						if (index == inputURLs) {
							closeBrowser(browser).catch( () => {} );
						}
						return;
					}
				}).catch( () => {} );
			}).catch( () => {} );
		}).catch( () => {} );
	}

	specifyLoginPage(candidateLinks, targetRpStruct, browser, mainPageURL, ownId).then( async function (targetRpStruct) {
		//console.log(targetRpStruct);
		if (targetRpStruct[0].loginLinks[0] == "No candidate login link") { // 후보 로그인 링크가 없는 경우
			clickLoginTag(targetRpStruct, browser, mainPageURL, ownId).then( async function (clickedPage) {
				getIdPFromText(targetRpStruct, browser, clickedPage, ownId, "mainPage").then( async function (targetRpStruct) {
					// text와 link를 혼합 사용하는 웹페이지 존재
					getIdPFromLink(targetRpStruct, browser, clickedPage, ownId).then( async function (targetRpStruct) {
						if (targetRpStruct[0].getIdPs.length == 0) {
							++index;
							fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
							fs.appendFileSync(resultFileName, "\nNo candidate login link\n");
							console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
							console.log("No candidate login link");
							if (index == inputURLs) {
								closeBrowser(browser).catch( () => {} );
							}
							return;
						} else {
							// 클릭한 페이지에 IdP가 존재하는 경우 출력
							++index;
							fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
							fs.appendFileSync(resultFileName, "\nIdP is on main page");
							fs.appendFileSync(resultFileName, "\nSSOIdP: " + targetRpStruct[0].getIdPs + "\n");
							console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
							console.log("IdP is on main page");
							console.log("SSOIdP: " + targetRpStruct[0].getIdPs);
							if (index == inputURLs) {
								closeBrowser(browser).catch( () => {} );
							}
							return;
						}
					}).catch( () => {} );
				}).catch( () => {} );
			}).catch( () => {} );
		}
		else if (targetRpStruct[0].loginLinks.length == 0) { // 로그인 페이지가 없는 경우
			clickLoginTag(targetRpStruct, browser, mainPageURL, ownId).then( async function (clickedPage) {
				if (clickedPage == "No Page") {
					++index;
					fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
					fs.appendFileSync(resultFileName, "\nNo login page\n");
					console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
					console.log("No login page");
					if (index == inputURLs) {
						closeBrowser(browser).catch( () => {} );
					}
					return;
				}
				getIdPFromText(targetRpStruct, browser, clickedPage, ownId, "mainPage").then( async function (targetRpStruct) {
					// text와 link를 혼합 사용하는 웹페이지 존재
					getIdPFromLink(targetRpStruct, browser, clickedPage, ownId).then( async function (targetRpStruct) {
						if (targetRpStruct[0].getIdPs.length == 0) {
							++index;
							fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
							fs.appendFileSync(resultFileName, "\nNo login page\n");
							console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
							console.log("No login page");
							if (index == inputURLs) {
								closeBrowser(browser).catch( () => {} );
							}
							return;
						} else {
							// 클릭한 페이지에 IdP가 존재하는 경우 출력
							++index;
							fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
							fs.appendFileSync(resultFileName, "\nIdP is on main page");
							fs.appendFileSync(resultFileName, "\nSSOIdP: " + targetRpStruct[0].getIdPs + "\n");
							console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
							console.log("IdP is on main page");
							console.log("SSOIdP: " + targetRpStruct[0].getIdPs);
							if (index == inputURLs) {
								closeBrowser(browser).catch( () => {} );
							}
							return;
						}
					}).catch( () => {} );
				}).catch( () => {} );
			}).catch( () => {} );
		}
		else {
			gotoLoginPage(targetRpStruct, browser, ownId).then( () => {return;} ).catch( () => {} );
		}
	}).catch( () => {} );
}

// 메인페이지에서 로그인 text 클릭
async function clickLoginTag(targetRpStruct, browser, mainPageURL, ownId) {
	console.log("clickLoginTag()");
	return new Promise( async function (resolve, reject) {
		page10 = await browser.newPage();
		await page10.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36');
		await page10.goto('http://'.concat(targetRpStruct[0].rpName.toLowerCase()), { waitUntil: 'networkidle0', timeout: 5000 }).catch( () => {} );

		var clickedPage = undefined;

		async function isLocatorReady(element, page) {
		  const isVisibleHandle = await page.evaluateHandle( (e) => {
		    const style = window.getComputedStyle(e);
		    return (style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0');
		 }, element);
			var visible = await isVisibleHandle.jsonValue();
			const box = await element.boxModel();
			if (visible && box) {
				return true;
			}
			return false;
		}

		const [aTag1] = await page10.$x("//a[contains(., '로그인')]");
		if ( aTag1 && (isLocatorReady(aTag1, page10) == true) ) {
			await aTag1.click();
			await page10.waitForNavigation({waitUntil: 'load'});
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(aTag1);
		}
		const [aTag2] = await page10.$x("//a[contains(., '\u767b\u5f55')]");
		if ( aTag2 && (isLocatorReady(aTag2, page10) == true) ) {
			await aTag2.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(aTag2);
		}
		const [aTag3] = await page10.$x("//a[contains(., 'Log in')]");
		if ( aTag3 && (isLocatorReady(aTag3, page10) == true) ) {
			await aTag3.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(aTag3);
		}
		const [aTag4] = await page10.$x("//a[contains(., 'Sign in')]");
		if ( aTag4 && (isLocatorReady(aTag4, page10) == true) ) {
			await aTag4.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(aTag4);
		}
		const [aTag5] = await page10.$x("//a[contains(., '\u767b\u5165')]");
		if ( aTag5 && (isLocatorReady(aTag5, page10) == true) ) {
			await aTag5.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(aTag5);
		}
		const [aTag6] = await page10.$x("//a[contains(., 'Login')]");
		if ( aTag6 && (isLocatorReady(aTag6, page10) == true) ) {
			await aTag6.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(aTag6);
		}

		const [btnTag1] = await page10.$x("//button[contains(., '로그인')]");
		if ( btnTag1 && (isLocatorReady(btnTag1, page10) == true) ) {
			await btnTag1.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(btnTag1);
		}
		const [btnTag2] = await page10.$x("//button[contains(., '\u767b\u5f55')]");
		if ( btnTag2 && (isLocatorReady(btnTag2, page10) == true) ) {
			await btnTag2.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(btnTag2);
		}
		const [btnTag3] = await page10.$x("//button[contains(., 'Log in')]");
		if ( btnTag3 && (isLocatorReady(btnTag3, page10) == true) ) {
			await btnTag3.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(btnTag3);
		}
		const [btnTag4] = await page10.$x("//button[contains(., 'Sign in')]");
		if ( btnTag4 && (isLocatorReady(btnTag4, page10) == true) ) {
			await btnTag4.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(btnTag4);
		}
		const [btnTag5] = await page10.$x("//a[contains(., '\u767b\u5165')]");
		if ( btnTag5 && (isLocatorReady(btnTag5, page10) == true) ) {
			await btnTag5.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(btnTag5);
		}
		const [btnTag6] = await page10.$x("//button[contains(., 'Login')]");
		if ( btnTag6 && (isLocatorReady(btnTag6, page10) == true) ) {
			await btnTag6.click();
			await page10.waitForNavigation({waitUntil: 'load', timeout: 5000}).catch( () => {} );
			clickedPage = await page10.content().catch( () => {} );
			if (clickedPage != undefined) {
				resolve(clickedPage);
			}
			await page10.goBack();
			await page10.waitForSelector(btnTag6);
		}

		if (clickedPage == undefined) {
			resolve("No Page");
		}
	}).catch( () => {} );
}

// 수집한 link들을 통해 login 페이지 찾기
async function specifyLoginPage(candidateLinks, targetRpStruct, browser, mainPageURL, ownId) {
	console.log("specifyLoginPage()");
	return new Promise( async function (resolve, reject) {
		const page2 = await browser.newPage();
		await page2.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36');

		let candidateLoginLinks = [];

		for (idx = 0; idx < candidateLinks.length; idx++) {
			var hasLogin = false;
			canLink = candidateLinks[idx].toString().toLowerCase();
			// 정규표현식에 알맞은 로그인 링크 후보군 추출
			var canLen = canLink.length;
			if ( (canLink.lastIndexOf('.jpg') == canLen-4 ) || (canLink.lastIndexOf('.jpeg') == canLen-5 ) || (canLink.lastIndexOf('.svg') == canLen-4) || (canLink.lastIndexOf('.png') == canLen-4) || (canLink.lastIndexOf('.js') == canLen-3) || (canLink.lastIndexOf('.css') == canLen-4) ) {
				continue;
			}
			if ( (canLink.indexOf("author") != -1) || (canLink.indexOf("<") != -1) || (canLink.indexOf(">") != -1) ) {
				continue;
			}
			for (i = 0; i < linkRegexes.length; i++) {
				if (canLink.match(linkRegexes[i]) != null) {
					hasLogin = true;
					break;
				}
			}
			if ( (hasLogin == true) && ( (canLink.indexOf("http") != -1) || (canLink.indexOf("/") != -1) || (canLink.indexOf("?") != -1) ) ){
				if (canLink.indexOf("http") == 0) {
					candidateLoginLinks.push(candidateLinks[idx]);
				} else if (canLink.indexOf("/") == 0) {
					var candidateLink1 = "http:" + candidateLinks[idx];
					var candidateLink2 = mainPageURL + candidateLinks[idx]; //현재 브라우저 URL 가져오기
					var candidateLink3 = "http://" + targetRpStruct[0].rpName.toLowerCase() + candidateLinks[idx]; // RP URL로 조합
					candidateLoginLinks.push(candidateLink1);
					candidateLoginLinks.push(candidateLink2);
					candidateLoginLinks.push(candidateLink3);
				} else {
					var candidateLink1 = "http://" + candidateLinks[idx];
					var candidateLink2 = mainPageURL + candidateLinks[idx]; //현재 브라우저 URL 가져오기
					var candidateLink3 = "http://" + targetRpStruct[0].rpName.toLowerCase() + "/" + candidateLinks[idx]; // RP URL로 조합
					candidateLoginLinks.push(candidateLink1);
					candidateLoginLinks.push(candidateLink2);
					candidateLoginLinks.push(candidateLink3);
				}
			}
		}
		candidateLoginLinks = Array.from(new Set(candidateLoginLinks)); // candidateLoginLinks 배열 중복제거

		if (candidateLoginLinks.length == 0) { // 후보 로그인 링크가 없는 경우 메시지 삽입 
			targetRpStruct[0].loginLinks.push("No candidate login link");
			resolve(targetRpStruct);
		}
		console.log(candidateLoginLinks);
		//candidateLoginLinks = ['http://netflix.com/login'];

		// 로그인 링크 후보군을 하나하나 방문하여 실제 로그인 링크 식별
		for (idx = 0; idx < candidateLoginLinks.length; idx++) {
			var isLogin = false;
			var canLoginPage = undefined;
			var errFlag = false;

			await page2.goto(candidateLoginLinks[idx], { waitUntil: 'networkidle0', timeout: 5000 }).then( async function() { 
				canLoginPage = await page2.content().catch( () => { errFlag = true; } ); 
			}).catch( async function() {
				await page2.goto(candidateLoginLinks[idx], { waitUntil: 'domcontentloaded', timeout: 5000 }).then( async function() { 
					canLoginPage = await page2.content().catch( () => { errFlag = true; } ); 
				}).catch( () => {} );
			});
			
			if ( (canLoginPage != undefined) && (errFlag != true) ) {
				console.log(candidateLoginLinks[idx]);
				//console.log(canLoginPage);
				const $ = cheerio.load(canLoginPage); // 웹페이지를 DOM 형태로 변환
				const $inputTags = $('input'); // input 태그만 추출
				//console.log($inputTags.length);

				for (i = 0; i < $inputTags.length; i++) {
					const inputTag = cheerio($inputTags[i]);
					let inputName = inputTag.attr('name');
					let inputType = inputTag.attr('type');
					let inputId = inputTag.attr('id');
					//console.log("inputName: " + inputName + " / inputType: " + inputType + " / inputId: " + inputId);

					// type이 hidden인 경우는 사용자의 눈에 보이지 않으므로 로그인과 관련되지 않음
					if (inputType != "hidden") {
						for (j = 0; j < pageRegexes.length; j++) {
							if ( (inputName != undefined) && (inputName.match(pageRegexes[j]) != null) ) {
								isLogin = true;
								break;
							}
							else if ( (inputType != undefined) && (inputType.match(pageRegexes[j]) != null) ) {
								isLogin = true;
								break;
							}
							else if ( (inputId != undefined) && (inputId.match(pageRegexes[j]) != null) ) {
								isLogin = true;
								break;
							}
						}
						if (isLogin == true) {
							break;
						}
					}
				}
				if (isLogin == true) {
					targetRpStruct[0].loginLinks.push(candidateLoginLinks[idx]);
				}
				//console.log(targetRpStruct[0]);
			}

			if (idx == candidateLoginLinks.length - 1) { // 모든 링크 방문 후 loginLink 담긴 구조체 리턴
				//console.log(targetRpStruct[0]);
				resolve(targetRpStruct);
			}
		}
	}).catch( () => {} );
}

// login 페이지로 이동 후 IdP 식별
async function gotoLoginPage(targetRpStruct, browser, ownId) { 
	console.log("gotoLoginPage()");
	
	//console.log(targetRpStruct[0].loginLinks);
	const page3 = await browser.newPage();
	await page3.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36');
	var searchCnt = 0; // login 링크 탐색 횟수
	var isDone = false;

	for (idx = 0; idx < targetRpStruct[0].loginLinks.length; idx++) {
		//console.log(targetRpStruct[0].loginLinks[idx]);
		await page3.goto(targetRpStruct[0].loginLinks[idx], { timeout: 5000, waitUntil: "networkidle0" }).then( async function() { 
			loginPage = await page3.content('utf-8').catch( () => {} ); 
		}).catch( async function() {
			await page3.goto(targetRpStruct[0].loginLinks[idx], { waitUntil: 'domcontentloaded', timeout: 5000 }).then( async function() { 
				loginPage = await page3.content('utf-8').catch( () => {} ); 
			}).catch( () => { 
				loginPage = undefined; 
			});
		});
		
		if (loginPage == undefined) {
			continue;
		}
		//console.log(loginPage);
		//getIdPFromText(loginPage, targetRpStruct, ownId).catch( () => {} );
		if (isDone == true) {
			return;
		}
		getIdPFromText(targetRpStruct, browser, loginPage, ownId, "loginPage").then( async function (targetRpStruct) {
			// text와 link를 혼합 사용하는 웹페이지 존재
			//console.log(targetRpStruct[0]);
			getIdPFromLink(targetRpStruct, browser, loginPage, ownId).then( async function (targetRpStruct) {
				//console.log(targetRpStruct[0]);
				if ( (targetRpStruct[0].getIdPs.length == 0) && (searchCnt == targetRpStruct[0].loginLinks.length - 1) ) {
					isDone = true;
					++index;
					fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
					fs.appendFileSync(resultFileName, "\nNo IdP\n");
					console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
					console.log("No IdP");
					if (index == inputURLs) {
						closeBrowser(browser).catch( () => {} );
					}
					return;
				} else if (targetRpStruct[0].getIdPs.length != 0) {
					isDone = true;
					// 메인페이지에 IdP가 존재하는 경우 출력
					++index;
					fs.appendFileSync(resultFileName, "[" + index + "] RP: " + targetRpStruct[0].rpName);
					fs.appendFileSync(resultFileName, "\nSSOIdP: " + targetRpStruct[0].getIdPs + "\n");
					console.log("\n[%d] RP: " + targetRpStruct[0].rpName, index);
					console.log("SSOIdP: " + targetRpStruct[0].getIdPs);
					if (index == inputURLs) {
						closeBrowser(browser).then( () => { return; } ).catch( () => {} );
					}
					return;
				} else {
					searchCnt++;
				}
			}).catch( () => {} );
		}).catch( () => {} );
	}
}

async function closeBrowser(browser) {
	console.log("\ncloseBrowser()");
	fs.close();
	await browser.close();
}