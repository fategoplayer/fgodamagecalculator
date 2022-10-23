    
$(function(){

    const tabRadio = $("*[name=tab-radio]");
    const tabLabel = $(".tab-label");
    const tabNum = tabRadio.length;
    const cover = $("#select-tab-cover")[0];
    const contents = $("#contents")[0];
    let coverX = 100;
    let loopHandler;
    
    // ラベルクリック時にスライドアニメーションを実行
    for (let i = 0; i < tabNum; i++) {
        tabLabel[i].onclick = () => {
            tabSlideAnim(i);
        }
    }
    
    // スライドアニメーション
    const tabSlideAnim = (x) => {
        const loopNum = 32; // アニメーション分割数 (値が大きいほどスライドが速くなる)
        let count = 0;
        const startScroll = contents.scrollLeft;
        const diffScroll = (contents.offsetWidth * x - startScroll);
        contents.style.scrollSnapType = "none"; // スクロールを一時的に無効化
        contents.style.overflowX = "hidden"; // スクロールを一時的に無効化
        cancelAnimationFrame(loopHandler); // 前に実行されていたアニメーションをキャンセル
        const loop = () => {
            if (count < loopNum) {
                count++;
                contents.scrollLeft = startScroll + easeOut(count / loopNum) * diffScroll;
                loopHandler = requestAnimationFrame(loop); // loopを再帰的に呼び出す
            } else {
                contents.style.scrollSnapType = "x mandatory"; // スクロールを有効に戻す
                contents.style.overflowX = "auto"; // スクロールを有効に戻す
                contents.scrollLeft = contents.offsetWidth * x;
            }
        }
        loop();
    }
    
    // スライドを滑らかに止める用の計算
    const easeOut = (p) => {
        return p * (2-p);
    }
    
    contents.onscroll = (e) => {
        // アンダーバーを連動して動かす。
        coverX = 100 * e.target.scrollLeft / contents.offsetWidth;
        cover.style.transform = "translateX(" + coverX + "%)";
    
        // スクロール量を取得してラジオボタンに反映させる
        if (e.target.scrollLeft < contents.offsetWidth / 2) {
            tabRadio[0].checked = true;
        }
        else if (e.target.scrollLeft < contents.offsetWidth * 3 / 2) {
            tabRadio[1].checked = true;
        }
        else if (e.target.scrollLeft < contents.offsetWidth * 5 / 2) {
            tabRadio[2].checked = true;
        }
        else if (e.target.scrollLeft < contents.offsetWidth * 7 / 2) {
            tabRadio[3].checked = true;
        }
        else {
            tabRadio[4].checked = true;
        }
    }

    /**
     * 表計算フォーカス遷移イベント
     */
    $(document).on("blur", "input", function () {
    
        setTimeout(function() {
            $(".floating-result").css({"position":""});
            $(".floating-result").css({"bottom":""});
        }, 200);

    });

    /**
     * 表計算フォーカス遷移イベント
     */
    $(document).on("focus", "input", function () {

        /*$(".floating-result").css({"position":"absolute"});*/
        /*$(".floating-result").css({"top":(window.scrollY + 20) + "px"});*/
        /*
        $(".floating-result").css({"display":"none"});
        */

    });

});