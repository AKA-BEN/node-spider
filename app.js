const superagent = require('superagent');
const cheerio = require('cheerio');
const fs = require('fs');

const reptileUrl = 'https://www.jianshu.com';
var reptileData = [];
var articleUrl = [];
var articleDetail;

// 请求获取文章列表数据
superagent
    .get(reptileUrl)
    .set('User-Agent','request')
    .then(function(res){
    if(!res.ok){
        console.log(res);
    }else{
        let $ = cheerio.load(res.text);
        $('#list-container .note-list li').each(function(i,el){
            var liData = {
                id: $(el).attr('data-note-id'),
                slug: $(el).find('.title').attr('href').replace('/p/',''),
                title:  $(el).find('.title').text(),
                abstract: $(el).find('.abstract').text(),
                thumbnails: $(el).find('.wrap-img>img').attr('src'),
                collection_tag: $(el).find('.collection-tag').text(),
                reads_count:$(el).find('.meta>a').eq(0).text()*1,
                comments_count: $(el).find('.meta>a').eq(1).text()*1,
                likes_count:$(el).find('.meta>span').eq(0).text()*1
            };
            reptileData.push(liData);
            articleUrl.push(reptileUrl+$(el).find('.title').attr('href'));
        });
        // 写入json文件
        fs.writeFile(__dirname+'/data/article-list.json',JSON.stringify(reptileData),function(err){
            if(err) console.log(err);
            console.log('文章列表数据写入完成！');
        });
        getDetail(articleUrl);
    }
});

// 获取文章详情数据
function getDetail(articleArr){
    if(articleArr.length<=0){
        console.log('链接数组为空');
        return false;
    };
    superagent
        .get(articleArr[0])
        .set('User-Agent','request')
        .then(function(res){
            if(!res.ok){
                console.log(res);
            }else{
                let $ = cheerio.load(res.text);
                articleDetail = {
                    slug: articleArr[0].replace('https://www.jianshu.com/p/',''),
                    title: $('.article h1[class="title"]').text(),
                    author: {
                        avatar: reptileUrl + $('.article .avatar>img').attr('src'),
                        name: $('.article .name>a').text(),
                        uid: $('.article .name>a').attr('href').replace('/u/','')
                    },
                    meta: {
                        time: $('.article .meta>.publish-time').text(),
                        wordage: /\s(\d+)/.exec($('.article .meta>.wordage').text())[1],
                        views_count: $('.article').find('.views-count').text(),
                        comments_count: $('.meta>.comments-count').text(),
                        likes_count: $('.meta>.likes-count').text(),
                        rewards_count : $('.meta>.rewards-count').text()
                    },
                    content: $('.article .show-content-free').text()
                }
                // 写入json文件                
                fs.writeFile(__dirname+'/data/'+articleDetail.slug+'.json',JSON.stringify(articleDetail),function(err){
                    if(err) console.log(err);
                    console.log(articleDetail.slug+'文章详情数据写入完成');
                });
                // 初始化
                articleDetail = {};
                articleArr.shift();
                if(articleArr.length<=0){
                    console.log('---文章详情数据获取完成！---');
                    return false;
                };
                // 递归-继续调用
                getDetail(articleArr);
            }
        })
}
