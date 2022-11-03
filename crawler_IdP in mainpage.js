// Produced by Ji-Hyun Nam in 2020

const puppeteer = require('puppeteer');	// https://github.com/puppeteer/puppeteer
const cheerio = require('cheerio');

index = 0;	// 코드 실행한 RP들의 index
const inputURLs = 10; // input으로 들어온 RP 개수

// 이벤트 리스너 제한 수정
process.setMaxListeners(100);

// target RP가 적힌 txt 파일을 읽어서 한페이지씩 접속
const targetListFileName = "D:/03 연구 - Token Revocation/AlexaTop10.txt";
const fs = require('fs');
targetRps = fs.readFileSync(targetListFileName, 'utf-8').toString().split('\r\n');

for (var i = 0; i < targetRps.length; i++) {
	scanWebPage(targetRps[i]).catch(
		async function (err) {
			//console.log(err);
	});
}
//targetRp = "https://secure.indeed.com/account/login?hl=ko_KR&co=KR&continue=https%3A%2F%2Fkr.indeed.com%2F%3Fr%3Dus&tmpl=desktop&service=my&from=gnav-util-homepage&_ga=2.224286674.897691551.1587370893-1069419286.1587370893";
//scanWebPage(targetRp).catch( async function(err) { } );

// target RP에 대한 정보를 저장하는 구조체
function structMem(targetRp) {
	var rpName = targetRp; // target RP 이름
	var loginLinks = []; // 로그인 웹페이지 배열
	var getIdPs = []; // 로그인 페이지의 IdP 배열
}

// target RP에 접속하여 link를 추출하는 함수
async function scanWebPage(targetRp) {
	// target RP 구조체 선언
	var targetRpStruct = new Array();
	targetRpStruct[0] = new structMem();
	targetRpStruct[0].rpName = targetRp;
	targetRpStruct[0].loginLinks = [];
	targetRpStruct[0].getIdPs = [];

	const browser = await puppeteer.launch({ headless: true, ignoreHTTPSErrors: true});
	const page1 = await browser.newPage();
	await page1.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3419.0 Safari/537.36');
	await page1.goto('http://'.concat(targetRpStruct[0].rpName.toLowerCase()), { waitUntil: 'networkidle2', timeout: 0 });

	mainPage = await page1.content('utf-8').catch( () => {} );

	if (mainPage == undefined) {
		console.log("\n[%d] RP: " + targetRpStruct[0].rpName, ++index);
		console.log("Main page is not loaded.");
		return;
	}

	//console.log(mainPage);

	let IdPRegexes = [/connect with/i,/* /\u5e10\u53f7\u767b\u5f55/i, */ /qq/i, /\u5fae\u535a/i, /\u652f\u4ed8\u5b9d/i, /\u5fae\u4fe1/i, /\u767e\u5ea6/, /\u5c0f\u7c73/, /계정 로그인/, /로 계속/, /로 로그인/, /아이디 로그인/, /사용하여 로그인/, /continue with/i, /sign with/i, /sign[\s-_]?up with/i, /sign[\s-_]?in/i, /sign[\s-_]?in using/i, /sign[\s-_]?on with/i, /log[\s-_]?in via/i,  /log[\s-_]?in[\s-_]?with/i, /log[\s-_]?on with/i, /Войти через/i, /entrar com/i];
	let noIdPRegs = [/[/]/, /account/i, /provider/i, /your/i, /guest/i, /member/i, /backup/i, /or/i, /pass/i, /without/i, /people/i, /different/i, /비밀번호로 로그인/, /다음/, /비공개로 로그인/, /모바일로 로그인/, /mobile/i, /또는/, /phone/i, /email/i, /이메일/, /방법/, /SAML/i, /\u65e0\u6cd5\u7528/];

	const $ = cheerio.load(mainPage); // 웹페이지를 DOM 형태로 변환
	const $spanTags = $('span'); // span 태그만 추출
	const $aTags = $('a'); // a 태그만 추출
	const $btnTags = $('button'); //button 태그만 추출

	for (i = 0; i < $spanTags.length; i++) {
		const spanTag = cheerio($spanTags[i]);
		var spanText = spanTag.text();
		console.log(spanText);
		if (spanText == undefined) {
			continue;
		}
		//使用 ~~ 登入/登录
		if ( (spanText.indexOf('\u4f7f\u7528') == 0) && ((spanText.lastIndexOf('\u767b\u5165') == spanText.length-2) || (spanText.endWith('\u767b\u5f55') == spanText.length-2)) ) {
			targetRpStruct[0].getIdPs.push(spanText);
			continue;
		} /*else if ( (spanText.indexOf('Mit') == 0) && (spanText.lastIndexOf('einloggen') == spanText.length-9) ) {
			targetRpStruct[0].getIdPs.push(spanText);
			continue;
		}*/ else if ( (spanText == "Sign in") || (spanText == "sign in") || (spanText == "Sign In") ) {
			continue;
		}
		var FLAG1 = false;
		// noIdPReg 정규표현식에 걸리지 않고, IdPRegexes 정규표현식에는 걸리는 단어만 출력
		for (j = 0; j < noIdPRegs.length; j++) {
			if (spanText.match(noIdPRegs[j]) != null) {
				FLAG1 = true;
				break;
			} else if ( (FLAG1 == false) && (j == noIdPRegs.length - 1) ) {
				for (k = 0; k < IdPRegexes.length; k++) {
					if (spanText.match(IdPRegexes[k]) != null) {
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
		//console.log(spanTitle);
		if (spanTitle == undefined) {
			continue;
		}
		//使用 ~~ 登入
		if ( (spanTitle.indexOf('\u4f7f\u7528') == 0) && ((spanTitle.lastIndexOf('\u767b\u5165') == spanTitle.length-2) || (spanTitle.endWith('\u767b\u5f55') == spanText.length-2)) ) {
			targetRpStruct[0].getIdPs.push(spanTitle);
			continue;
		} /*else if ( (spanTitle.indexOf('Mit') == 0) && (spanTitle.lastIndexOf('einloggen') == spanTitle.length-9) ) {
			targetRpStruct[0].getIdPs.push(spanTitle);
			continue;
		}*/ else if ( (spanTitle == "Sign in") || (spanTitle == "sign in") || (spanTitle == "Sign In") ) {
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
					if (spanTitle.match(IdPRegexes[k]) != null) {
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
	
	for (i = 0; i < $aTags.length; i++) {
		const aTag = cheerio($aTags[i]);
		var aText = aTag.text();
		//console.log(aText);
		if (aText == undefined) {
			continue;
		}
		if ( (aText.indexOf('\u4f7f\u7528') == 0) && ((aText.lastIndexOf('\u767b\u5165') == aText.length-2) || (aText.endWith('\u767b\u5f55') == aText.length-2)) ) {
			targetRpStruct[0].getIdPs.push(aText);
			continue;
		} /*else if ( (aText.indexOf('Mit') == 0) && (aText.lastIndexOf('einloggen') == aText.length-9) ) {
			targetRpStruct[0].getIdPs.push(aText);
			continue;
		}*/ else if ( (aText == "Sign in") || (aText == "sign in") || (aText == "Sign In") ) {
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
					if (aText.match(IdPRegexes[k]) != null) {
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
		const aTag = cheerio($aTags[i]);
		var aTitle = aTag.attr('title');

		if (aTitle == undefined) {
			continue;
		}
		//console.log(aTitle);
		if ( (aTitle.indexOf('\u4f7f\u7528') == 0) && ((aTitle.lastIndexOf('\u767b\u5165') == aTitle.length-2) || (aTitle.endWith('\u767b\u5f55') == aTitle.length-2)) ) {
			targetRpStruct[0].getIdPs.push(aTitle);
			continue;
		} /*else if ( (aTitle.indexOf('Mit') == 0) && (aTitle.lastIndexOf('einloggen') == aTitle.length-9) ) {
			targetRpStruct[0].getIdPs.push(aTitle);
			continue;
		}*/ else if ( (aTitle == "Sign in") || (aTitle == "sign in") || (aTitle == "Sign In") ) {
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
					if (aTitle.match(IdPRegexes[k]) != null) {
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
	for (i = 0; i < $btnTags.length; i++) {
		const btnTag = cheerio($btnTags[i]);
		var btnText = btnTag.text();
		//console.log(btnText);
		if (btnText == undefined) {
			continue;
		}
		if ( (btnText.indexOf('\u4f7f\u7528') == 0) && ((btnText.lastIndexOf('\u767b\u5165') == btnText.length-2) || (btnText.endWith('\u767b\u5f55') == btnText.length-2)) ) {
			targetRpStruct[0].getIdPs.push(btnText);
			continue;
		} /*else if ( (btnText.indexOf('Mit') == 0) && (btnText.lastIndexOf('einloggen') == btnText.length-9) ) {
			targetRpStruct[0].getIdPs.push(btnText);
			continue;
		}*/ else if ( (btnText == "Sign in") || (btnText == "sign in") || (btnText == "Sign In") ) {
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
					if (btnText.match(IdPRegexes[k]) != null) {
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
		//console.log(btnId);
		if (btnId == undefined) {
			continue;
		}
		if ( (btnId.indexOf('\u4f7f\u7528') == 0) && ((btnId.lastIndexOf('\u767b\u5165') == btnId.length-2) || (btnId.endWith('\u767b\u5f55') == btnText.length-2)) ) {
			targetRpStruct[0].getIdPs.push(btnId);
			continue;
		} /*else if ( (btnId.indexOf('Mit') == 0) && (btnId.lastIndexOf('einloggen') == btnId.length-9) ) {
			targetRpStruct[0].getIdPs.push(btnId);
			continue;
		}*/ else if ( (btnId == "Sign in") || (btnId == "sign in") || (btnId == "Sign In") ) {
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
					if (btnId.match(IdPRegexes[k]) != null) {
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

	targetRpStruct[0].getIdPs = Array.from(new Set(targetRpStruct[0].getIdPs)); // getIdPs 배열 중복제거

	if (targetRpStruct[0].getIdPs.length != 0) {
		console.log("\n[%d] RP: " + targetRpStruct[0].rpName, ++index);
		console.log("SSOIdP: " + targetRpStruct[0].getIdPs);
	}
	// 모든 로그인 링크를 탐색했지만 IdP가 null인 경우
	else {
		console.log("\n[%d] RP: " + targetRpStruct[0].rpName, ++index);
		console.log("No IdP on main page");
	}
}