var mysql = require('mysql');
var dbconfig   = require('../config/database');
var crawling = require('../crawling/crawling');
var con = mysql.createConnection(dbconfig);

//중복 여부 확인
exports.checkDuplication = (user, userPreferFood) =>{
	return new Promise((resolve) =>{
		//중복 확인. 존재 할 경우 : 1 || 없을 경우 : 0 
		const sql = `SELECT EXISTS (SELECT * FROM prefer WHERE food = '${userPreferFood}' AND user_idx = (SELECT user_idx FROM user WHERE userkey = '${user}')) AS success`;
		
		con.query(sql, (err, result)=>{
			
			if(err) throw err;
			resolve(result[0].success);
		});
	});
};

//선호 메뉴 추가
exports.add = (user, userPreferFood)=>{
	return new Promise(async resolve =>{
		
		//https://jsdev.kr/t/module-exports/3341 참고하길.
		const isDataDuplication = await exports.checkDuplication(user, userPreferFood);

		if(!isDataDuplication){
			
			const sql = `INSERT INTO prefer (user_idx, food) VALUES `+
				  `((SELECT * FROM (SELECT user_idx FROM user WHERE userkey = '${user}') AS temp), '${userPreferFood}')`

			con.query(sql, (err, result)=>{
				if(err) throw err;
				console.log('유저가 입력한 음식을 추가 하였습니다.');
			});
			
		}else{
			console.log('아이템이 이미 존재하여 추가하지 않았습니다.');
		}
		resolve('추가 호출');
	});
};

//선호 메뉴 삭제
exports.delete = (user, userPreferFood)=>{
	return new Promise(resolve =>{
		const sql = `DELETE FROM prefer WHERE `+
			  `food = '${userPreferFood}' AND `+
			  `user_idx = (SELECT user_idx FROM user WHERE userkey = '${user}')`;
		
		con.query(sql, (err, result)=>{
			if(err) throw err;
			console.log('유저가 입력한 음식을 삭제 하였습니다.');
		});
		//resolve 꼭 해야하..?
		resolve('삭제 호출');
	});
};

//선호 메뉴 읽어오기

exports.getFavoriteKeyword = (user) =>{
	
	return new Promise(resolve=>{
		
		const sql = `SELECT food FROM prefer WHERE user_idx = (SELECT user_idx FROM user WHERE userkey = '${user}')`;
		con.query(sql, (err, result)=>{
			if(err) throw err;
			
			const KeywordList = [];

			for(i in result){
				KeywordList.push(result[i].food);
			}
			//선호 메뉴 키워드 반환
			resolve(KeywordList);
		
		});
	});
};

exports.getFavoriteMenu = async (user, keywordList) =>{
	
	//선호 키워드를 받아옴
	//여기서 await는 하위, 하위 값을 await로 받아오기 때문임
	//오늘, 내일의 모든 식당의 학식 메뉴를 받아옴
	const allMenu = await crawling.getAllMenu();

	//선호 학식을 담을 배열
	let result = [];
	
	// 선호 메뉴를 찾기 위해 키워드와 일치 하는 학식을 찾음
	for(let keyword in keywordList){
		for(let menu in allMenu){
			if (allMenu[menu].indexOf(keywordList[keyword]) > -1){
				result.push(allMenu[menu]);
			}
		}
	}
	return result;
};