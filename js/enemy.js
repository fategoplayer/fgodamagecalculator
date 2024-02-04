const card_list = { "B": 1.5, "A": 1.0, "Q": 0.8 }; //宝具色補正
const correctio_lv90 = { "0": 1.390, "1": 1.508, "2": 1.390, "3": 1.289, "4": 1.126, "5": 1.000 };
const correctio_lv100 = { "0": 1.546, "1": 1.677, "2": 1.546, "3": 1.434, "4": 1.253, "5": 1.112 };
const correctio_lv110 = { "0": 1.703, "1": 1.847, "2": 1.703, "3": 1.579, "4": 1.379, "5": 1.224 };
const correctio_lv120 = { "0": 1.859, "1": 2.016, "2": 1.859, "3": 1.724, "4": 1.506, "5": 1.337 };
const defaultRow = 15; // 初期行数
var rowNumber = 0; // 現在行数
var selDamageTotal = 0;
var selDamageNum = 0;
var servantList = null;

$(function(){
    /**
     * フォーカスイベント
     */
    $(document).on("focus", "input", function () {
        
        // フォーカス時に選択する
        this.select();

    });

    /**
     * 表計算フォーカス遷移イベント
     */
    $("#calcTable").on("blur", "input", function () {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // ブランクなら0を入れる
        if (this.value == "") {
            if (this.id == "atk_" + recNumber) {
                // atkがブランクなら初期化
                clearParam(recNumber);
            }
            else {
                this.value = "0";
            }
        }

        // 数値変換
        this.value = parseFloat(this.value);

        // 対象行を計算
        calcMain(recNumber);
        
        // 選択トータルを初期化
        clearSelTotal(recNumber);
    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", "select", function () {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 対象行を計算
        calcMain(recNumber);

        // 選択トータル初期化
        clearSelTotal();

    });

    /**
     * ↑入れ替え
     */
    $(document).on("click", ".up_change_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) - 1;

        // 行入れ替え実行
        changeParam(recNumber, recNext);

        // 再計算
        calcMain(recNumber);
        calcMain(recNext);

        return false;

    });

    /**
     * ↓入れ替え
     */
    $(document).on("click", ".down_change_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) + 1;

        // 行入れ替え実行
        changeParam(recNumber, recNext);

        // 再計算
        calcMain(recNumber);
        calcMain(recNext);

        return false;

    });

    /**
     * ↑コピー
     */
    $(document).on("click", ".up_copy_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) - 1;

        // 行コピー実行
        copyParam(recNumber, recNext);

        // コピー先を再計算
        calcMain(recNext);

        return false;

    });

    /**
     * ↓コピー
     */
    $(document).on("click", ".down_copy_link", function() {
        var recNumber = this.id.split("_")[this.id.split("_").length - 1];
        var recNext = Number(recNumber) + 1;

        // 行コピー実行
        copyParam(recNumber, recNext);

        // コピー先を再計算
        calcMain(recNext);

        return false;

    });

    /**
     * クリアボタンイベント
     */
    $(document).on("click", ".clear", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 行のパラメーターを初期化
        clearParam(recNumber);

        // 選択トータル初期化
        clearSelTotal();

        return false;

    });

    /**
     * 画面表示後
     */
    $(document).ready(function(){

        // 初期表示にATK0以外を再計算
        for (let cnt = 0; cnt < defaultRow + rowNumber; cnt++){
            if ($("#atk_" + cnt).val() != "0") {
                // 再計算
                calcMain(cnt);
            }
        }

    });

    /**
     * 計算結果押下イベント
     */
    $(document).on("click", ".wrap_dmg_result", function() {

        if ($(this).css("background-color") == "rgb(255, 255, 197)") {
            $(this).css({"background":""});
            selDamageTotal = selDamageTotal - Number($(this).children("output").val().replace(/,/g, ""));
            selDamageNum -= 1;
        }
        else {
            $(this).css({"background":"#FFFFC5"});
            selDamageTotal = selDamageTotal + Number($(this).children("output").val().replace(/,/g, ""));
            selDamageNum += 1;
        }
        
        $("#out_sel_total").val(Number(selDamageTotal).toLocaleString());

        if (selDamageNum > 0) {
            $(".sel_total").css({"display":"flex"})
        }
        else {
            $(".sel_total").css({"display":""})
        }

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".prob_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // 行の目標ダメージを復元
        $("#enemy_hp").val($("#prob_hp_" + recNumber).val());

        if ($("#search_servant_no_" + recNumber).val() != "") {
            $("#servant-class-enemy").val($("#search_servant_class_" + recNumber).val());
            $("#servant-rare-enemy").val($("#search_servant_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeEnemySelectBox();
            $("#servant-name-enemy").val($("#search_servant_no_" + recNumber).val());
        }
        else if ($("#np_star_enemy_no_" + recNumber).val() != "") {
            $("#servant-class-enemy").val($("#np_star_enemy_class_" + recNumber).val());
            $("#servant-rare-enemy").val($("#np_star_enemy_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeEnemySelectBox();
            $("#servant-name-enemy").val($("#np_star_enemy_no_" + recNumber).val());
        }

        if ($("#np_star_servant_no_" + recNumber).val() != "") {
            $("#servant-class").val($("#np_star_servant_class_" + recNumber).val());
            $("#servant-rare").val($("#np_star_servant_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeServantSelectBox();
            $("#servant-name").val($("#np_star_servant_no_" + recNumber).val());
        }

        $("#ND").val($("#nd_" + recNumber).val());
        $("#NA_buff").val($("#na_buff_" + recNumber).val());
        $("#ND_buff").val($("#nd_buff_" + recNumber).val());
        $("#b_hit").val($("#b_hit_" + recNumber).val());
        $("#a_hit").val($("#a_hit_" + recNumber).val());
        $("#q_hit").val($("#q_hit_" + recNumber).val());
        $("#np_hit").val($("#np_hit_" + recNumber).val());
        $("#NA_enemy").val($("#na_enemy_" + recNumber).val());

        // パラメーターを撃破率画面にコピー
        copyProbInput(recNumber);

        // パラメーターをNPスター計算画面にコピー
        copyNpStarInput(recNumber);

        // 撃破率計算
        calcProb();

        // NPスター計算
        calcRate();

        // 行番号を保持
        $("#prob_recNumber").val(recNumber);

        return false;

    });

    /**
     * 撃破率フォーカス遷移イベント
     */
    $("#probTable").on("blur", "input", function () {

        if (this.value == "") {this.value = "0";};

        this.value = parseFloat(this.value);

        // 撃破率計算
        calcProb();
        
        // 目標ダメージを保持
        $("#prob_hp_" + $("#prob_recNumber").val()).val($("#enemy_hp").val());

    });

    /**
     * NPスターフォーカス遷移イベント
     */
    $(".npStarTable").on("blur", "input", function () {

        if (this.value == "") {this.value = "0";};

        this.value = parseFloat(this.value);

        // NPスター計算
        calcRate();

        // バフを保持
        $("#nd_" + $("#prob_recNumber").val()).val($("#ND").val());
        $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
        $("#nd_buff_" + $("#prob_recNumber").val()).val($("#ND_buff").val());
        $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
        $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
        $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
        $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
        $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());

    });

    /**
     * セレクトボックス変更イベント
     */
    $(document).on("change", ".select_np_star", function () {

        // NPスター計算
        calcRate();

        // バフを保持
        $("#nd_" + $("#prob_recNumber").val()).val($("#ND").val());
        $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
        $("#nd_buff_" + $("#prob_recNumber").val()).val($("#ND_buff").val());
        $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
        $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
        $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
        $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
        $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());

    });

    /**
     * サーヴァント検索―クラス・レアリティ変更イベント
     */
    $(document).on("change", ".servarnt-search-select-enemy", function () {

        // エネミーセレクトボックスを再作成
        remakeEnemySelectBox();

    });

    /**
     * サーヴァント検索―クラス・レアリティ変更イベント
     */
    $(document).on("change", ".servarnt-search-select", function () {

        // サーヴァントセレクトボックスを再作成
        remakeServantSelectBox();

    });

    //エネミー情報を反映させる
    $(document).on("click", "#btn-apply-enemy", function() {

        if (enemyApply()) {
            // NPスター計算
            calcRate();
            // サーヴァント情報を保持
            $("#np_star_enemy_no_" + $("#prob_recNumber").val()).val($("#servant-name-enemy").val());
            $("#np_star_enemy_class_" + $("#prob_recNumber").val()).val($("#servant-class-enemy").val());
            $("#np_star_enemy_rare_" + $("#prob_recNumber").val()).val($("#servant-rare-enemy").val());
            // バフを保持
            $("#nd_" + $("#prob_recNumber").val()).val($("#ND").val());
            $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
            $("#nd_buff_" + $("#prob_recNumber").val()).val($("#ND_buff").val());
            $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
            $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
            $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
            $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
            $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());
        }

        return false;

    });

    //サーヴァント情報を反映させる
    $(document).on("click", "#btn-apply", function() {

        if (servantApply()) {
            // NPスター計算
            calcRate();
            // サーヴァント情報を保持
            $("#np_star_servant_no_" + $("#prob_recNumber").val()).val($("#servant-name").val());
            $("#np_star_servant_class_" + $("#prob_recNumber").val()).val($("#servant-class").val());
            $("#np_star_servant_rare_" + $("#prob_recNumber").val()).val($("#servant-rare").val());
            // バフを保持
            $("#nd_" + $("#prob_recNumber").val()).val($("#ND").val());
            $("#na_buff_" + $("#prob_recNumber").val()).val($("#NA_buff").val());
            $("#nd_buff_" + $("#prob_recNumber").val()).val($("#ND_buff").val());
            $("#b_hit_" + $("#prob_recNumber").val()).val($("#b_hit").val());
            $("#a_hit_" + $("#prob_recNumber").val()).val($("#a_hit").val());
            $("#q_hit_" + $("#prob_recNumber").val()).val($("#q_hit").val());
            $("#np_hit_" + $("#prob_recNumber").val()).val($("#np_hit").val());
            $("#na_enemy_" + $("#prob_recNumber").val()).val($("#NA_enemy").val());
        }

        return false;

    });

    /**
     * サーヴァント検索―クラス・レアリティ変更イベント
     */
   $(document).on("change", ".search_sarvant_select", function () {

    // サーヴァントセレクトボックスを再作成
    remakeSearchServantSelectBox();

    // サーヴァント情報表示
    servantInfo();

   });

    /**
     * サーヴァント検索―サーヴァント名変更イベント
     */
    $(document).on("change", "#search_servant_name", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―レベル変更イベント
     */
    $(document).on("change", "#search_servant_lvl", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    /**
     * サーヴァント検索―宝具レベル変更イベント
     */
    $(document).on("change", "#search_servant_nplvl", function () {

        // サーヴァント情報表示
        servantInfo();

    });

    //開くボタンをクリックしたらモーダルを表示する
    $(document).on("click", ".search_link", function() {

        var recNumber = this.id.split("_")[this.id.split("_").length - 1];

        // サーヴァント情報を復元
        if ($("#search_servant_no_" + recNumber).val() != "") {
            $("#search_servant_class").val($("#search_servant_class_" + recNumber).val());
            $("#search_servant_rare").val($("#search_servant_rare_" + recNumber).val());
            // サーヴァントセレクトボックスを再作成
            remakeSearchServantSelectBox();
            $("#search_servant_name").val($("#search_servant_no_" + recNumber).val());
            $("#search_servant_lvl").val($("#search_servant_lvl_" + recNumber).val());
            $("#search_servant_nplvl").val($("#search_servant_nplvl_" + recNumber).val());

        }

        // 行番号を保持
        $("#search_recNumber").val(recNumber);

        // サーヴァント情報表示
        servantInfo();

        return false;

    });

    /**
     * サーヴァント検索―選択押下イベント
     */
    $(document).on("click", "#btnSelected", function() {

        var recNumber = $("#search_recNumber").val();

        // 入力初期化
        clearParamTable(recNumber);

        $(servantList).each(function() {
            
            if ($("#search_servant_name").val() == this["No"]) {

                var atk;

                // サーヴァント画像変更
                setServantImage(recNumber, this["No"]);

                switch ($("#search_servant_lvl").val()) {
                    case "MAX" :
                        atk = Number(this["MaxAtk"]);
                        break;
                    case "100" :
                        atk = rounddown(Number(this["BaseAtk"]) 
                            + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                            * Number(correctio_lv100[Number(this["レアリティ"])]),0);
                        break;
                    case "110" :
                        atk = rounddown(Number(this["BaseAtk"]) 
                            + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                            * Number(correctio_lv110[Number(this["レアリティ"])]),0);
                        break;
                    case "120" :
                        atk = rounddown(Number(this["BaseAtk"]) 
                            + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                            * Number(correctio_lv120[Number(this["レアリティ"])]),0);
                        break;
                    default :
                        break;
                }

                // ATK
                $("#atk_" + recNumber).val(Number(atk));
                // 宝具倍率
                switch ($("#search_servant_nplvl").val()) {
                    case "1" :
                        $("#np_dmg_" + recNumber).val(this["宝具Lv1"]);
                        break;
                    case "2" :
                        $("#np_dmg_" + recNumber).val(this["宝具Lv2"]);
                        break;
                    case "3" :
                        $("#np_dmg_" + recNumber).val(this["宝具Lv3"]);
                        break;
                    case "4" :
                        $("#np_dmg_" + recNumber).val(this["宝具Lv4"]);
                        break;
                    case "5" :
                        $("#np_dmg_" + recNumber).val(this["宝具Lv5"]);
                        break;
                    default :
                        break;
                }
                // 宝具種類
                $("#np_kind_" + recNumber).val(this["宝具カード"]);
                // クラススキル_カード
                if (this["クラススキル_Bバフ"] != "0"){
                    $("#b_card_buff_" + recNumber).val(this["クラススキル_Bバフ"]);
                }
                if (this["クラススキル_Aバフ"] != "0") {
                    $("#a_card_buff_" + recNumber).val(this["クラススキル_Aバフ"]);
                }
                if (this["クラススキル_Qバフ"] != "0") {
                    $("#q_card_buff_" + recNumber).val(this["クラススキル_Qバフ"]);
                }
                // クラススキル_クリティカル
                if (this["クラススキル_クリバフ"] != "0") {
                    $("#cri_buff_" + recNumber).val(this["クラススキル_クリバフ"]);
                }
                if (this["クラススキル_Bクリバフ"] != "0") {
                    $("#b_card_cri_buff_" + recNumber).val(this["クラススキル_Bクリバフ"]);
                }
                if (this["クラススキル_Aクリバフ"] != "0") {
                    $("#a_card_cri_buff_" + recNumber).val(this["クラススキル_Aクリバフ"]);
                }
                if (this["クラススキル_Qクリバフ"] != "0") {
                    $("#q_card_cri_buff_" + recNumber).val(this["クラススキル_Qクリバフ"]);
                }
                // クラススキル_宝具
                if (this["クラススキル_宝具バフ"] != "0") {
                    $("#np_buff_" + recNumber).val(this["クラススキル_宝具バフ"]);
                }
                // クラススキル_固定ダメージ
                if (this["クラススキル_固定ダメージ"] != "0") {
                    $("#fixed_dmg_" + recNumber).val(this["クラススキル_固定ダメージ"]);
                }
                // クラス相性
                switch (this["クラス"]) {
                    case "剣" :
                    case "騎" :
                        $("#class_affinity_" + recNumber).val("2.0");
                        $("#class_servant_" + recNumber).val("1.00");
                        break;
                    case "弓" :
                        $("#class_affinity_" + recNumber).val("2.0");
                        $("#class_servant_" + recNumber).val("0.95");
                        break;
                    case "槍" :
                        $("#class_affinity_" + recNumber).val("2.0");
                        $("#class_servant_" + recNumber).val("1.05");
                        break;
                    case "術" :
                    case "殺" :
                        $("#class_affinity_" + recNumber).val("2.0");
                        $("#class_servant_" + recNumber).val("0.90");
                        break;
                    case "狂" :
                        $("#class_affinity_" + recNumber).val("1.5");
                        $("#class_servant_" + recNumber).val("1.10");
                        break;
                    case "盾" :
                    case "月" :
                    case "降" :
                        $("#class_affinity_" + recNumber).val("1.0");
                        $("#class_servant_" + recNumber).val("1.00");
                        break;
                    case "裁" :
                    case "讐" :
                        $("#class_affinity_" + recNumber).val("1.0");
                        $("#class_servant_" + recNumber).val("1.10");
                        break;
                    case "分" :
                    case "詐" :
                    case "獣" :
                        $("#class_affinity_" + recNumber).val("1.5");
                        $("#class_servant_" + recNumber).val("1.00");
                        break;
                    default :
                        break;
                }

                $("#b_hit_" + recNumber).val(this["BHIT"]);
                $("#a_hit_" + recNumber).val(this["AHIT"]);
                $("#q_hit_" + recNumber).val(this["QHIT"]);
                $("#np_hit_" + recNumber).val(this["宝具HIT"]);
                $("#na_enemy_" + recNumber).val(this["クラス"]);

                // hidden
                $("#search_servant_class_" + recNumber).val($("#search_servant_class").val());
                $("#search_servant_rare_" + recNumber).val($("#search_servant_rare").val());
                $("#search_servant_lvl_" + recNumber).val($("#search_servant_lvl").val());
                $("#search_servant_nplvl_" + recNumber).val($("#search_servant_nplvl").val());
                $("#search_servant_no_" + recNumber).val(this["No"]);

                return;

            }

        });

        // 再計算
        calcMain(recNumber)
        
        return true;

    });

    /**
     * エンターキーでフォーカス移動
     * メイン画面
     */
    $("#calcTable").keypress(function(e) { 
        var c = e.which ? e.which : e.keyCode; // クロスブラウザ対応

        // エンターキー
        if (c == 13) {

            var activeObj = $("#" + document.activeElement.id);
            var splitStr = activeObj[0].id.split("_");
            var recNumber = 0;
            var nextIdStr = "";
            var activeIdStr ="";
            var nextObj = null;

            // 遷移先のIDを作成
            for(cnt = 0; cnt < splitStr.length - 1; cnt++){
                activeIdStr = activeIdStr + splitStr[cnt] + "_";
            }

            if (!e.shiftKey) {
                // 下に進む
                recNumber = Number(splitStr[splitStr.length - 1]) + 1;

                 // 遷移先が別IDの場合の対応
                switch (activeIdStr){
                    case "def_debuff_" :
                        nextIdStr = "atk_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "atk_buff_" :
                        nextIdStr = "def_debuff_";
                        recNumber--;
                        break;
                    case "b_card_debuff_" :
                        nextIdStr = "b_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_card_buff_" :
                        nextIdStr = "b_card_debuff_";
                        recNumber--;
                        break;
                    case "a_card_debuff_" :
                        nextIdStr = "a_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "a_card_buff_" :
                        nextIdStr = "a_card_debuff_";
                        recNumber--;
                        break;
                    case "q_card_debuff_" :
                        nextIdStr = "q_card_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "q_card_buff_" :
                        nextIdStr = "q_card_debuff_";
                        recNumber--;
                        break;
                    case "b_card_cri_buff_" :
                        nextIdStr = "a_card_cri_buff_";
                        recNumber--;
                        break;
                    case "a_card_cri_buff_" :
                        nextIdStr = "q_card_cri_buff_";
                        recNumber--;
                        break;
                    case "q_card_cri_buff_" :
                        nextIdStr = "b_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_card_power_buff_" :
                        nextIdStr = "a_card_power_buff_";
                        recNumber--;
                        break;
                    case "a_card_power_buff_" :
                        nextIdStr = "q_card_power_buff_";
                        recNumber--;
                        break;
                    case "q_card_power_buff_" :
                        nextIdStr = "b_card_power_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "b_footprints_" :
                        nextIdStr = "a_footprints_";
                        recNumber--;
                        break;
                    case "a_footprints_" :
                        nextIdStr = "q_footprints_";
                        recNumber--;
                        break;
                    case "q_footprints_" :
                        nextIdStr = "b_footprints_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_atk_buff_1st_" :
                        nextIdStr = "advanced_atk_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_atk_buff_2nd_" :
                        nextIdStr = "advanced_atk_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_atk_buff_3rd_" :
                        nextIdStr = "advanced_atk_buff_Ex_";
                        recNumber--;
                        break;
                    case "advanced_atk_buff_Ex_" :
                        nextIdStr = "advanced_atk_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_def_debuff_1st_" :
                        nextIdStr = "advanced_def_debuff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_def_debuff_2nd_" :
                        nextIdStr = "advanced_def_debuff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_def_debuff_3rd_" :
                        nextIdStr = "advanced_def_debuff_Ex_";
                        recNumber--;
                        break;
                    case "advanced_def_debuff_Ex_" :
                        nextIdStr = "advanced_def_debuff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_card_buff_1st_" :
                        nextIdStr = "advanced_card_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_card_buff_2nd_" :
                        nextIdStr = "advanced_card_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_card_buff_3rd_" :
                        nextIdStr = "advanced_card_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_card_debuff_1st_" :
                        nextIdStr = "advanced_card_debuff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_card_debuff_2nd_" :
                        nextIdStr = "advanced_card_debuff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_card_debuff_3rd_" :
                        nextIdStr = "advanced_card_debuff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_cri_buff_1st_" :
                        nextIdStr = "advanced_cri_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_cri_buff_2nd_" :
                        nextIdStr = "advanced_cri_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_cri_buff_3rd_" :
                        nextIdStr = "advanced_cri_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_supereffective_buff_1st_" :
                        nextIdStr = "advanced_supereffective_buff_2nd_";
                        recNumber--;
                        break;
                    case "advanced_supereffective_buff_2nd_" :
                        nextIdStr = "advanced_supereffective_buff_3rd_";
                        recNumber--;
                        break;
                    case "advanced_supereffective_buff_3rd_" :
                        nextIdStr = "advanced_supereffective_buff_Ex_";
                        recNumber--;
                        break;
                    case "advanced_supereffective_buff_Ex_" :
                        nextIdStr = "advanced_supereffective_buff_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_fixed_dmg_1st_" :
                        nextIdStr = "advanced_fixed_dmg_2nd_";
                        recNumber--;
                        break;
                    case "advanced_fixed_dmg_2nd_" :
                        nextIdStr = "advanced_fixed_dmg_3rd_";
                        recNumber--;
                        break;
                    case "advanced_fixed_dmg_3rd_" :
                        nextIdStr = "advanced_fixed_dmg_Ex_";
                        recNumber--;
                        break;
                    case "advanced_fixed_dmg_Ex_" :
                        nextIdStr = "advanced_fixed_dmg_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    case "advanced_special_def_1st_" :
                        nextIdStr = "advanced_special_def_2nd_";
                        recNumber--;
                        break;
                    case "advanced_special_def_2nd_" :
                        nextIdStr = "advanced_special_def_3rd_";
                        recNumber--;
                        break;
                    case "advanced_special_def_3rd_" :
                        nextIdStr = "advanced_special_def_Ex_";
                        recNumber--;
                        break;
                    case "advanced_special_def_Ex_" :
                        nextIdStr = "advanced_special_def_1st_";
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                    default :
                        nextIdStr = activeIdStr;
                        if (Number(splitStr[splitStr.length - 1]) == (rowNumber + defaultRow - 1)) {
                            // 最終行なら1行目に戻る
                            recNumber = 0;
                        }
                        break;
                }
            }
            else {
                // 上に戻る
                recNumber = Number(splitStr[splitStr.length - 1]) - 1;
                
                // 遷移先が別IDの場合の対応
               switch (activeIdStr){
                    case "def_debuff_" :
                        nextIdStr = "atk_buff_";
                        recNumber++;
                        break;
                    case "atk_buff_" :
                        nextIdStr = "def_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "b_card_debuff_" :
                        nextIdStr = "b_card_buff_";
                        recNumber++;
                        break;
                    case "b_card_buff_" :
                        nextIdStr = "b_card_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_debuff_" :
                        nextIdStr = "a_card_buff_";
                        recNumber++;
                        break;
                    case "a_card_buff_" :
                        nextIdStr = "a_card_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "q_card_debuff_" :
                        nextIdStr = "q_card_buff_";
                        recNumber++;
                        break;
                    case "q_card_buff_" :
                        nextIdStr = "q_card_debuff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "b_card_power_buff_" :
                        nextIdStr = "q_card_power_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_power_buff_" :
                        nextIdStr = "b_card_power_buff_";
                        recNumber++;
                        break;
                    case "q_card_power_buff_" :
                        nextIdStr = "a_card_power_buff_";
                        recNumber++;
                        break;
                    case "b_card_cri_buff_" :
                        nextIdStr = "q_card_cri_buff_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_card_cri_buff_" :
                        nextIdStr = "b_card_cri_buff_";
                        recNumber++;
                        break;
                    case "q_card_cri_buff_" :
                        nextIdStr = "a_card_cri_buff_";
                        recNumber++;
                        break;
                    case "b_footprints_" :
                        nextIdStr = "q_footprints_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "a_footprints_" :
                        nextIdStr = "b_footprints_";
                        recNumber++;
                        break;
                    case "q_footprints_" :
                        nextIdStr = "a_footprints_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_2nd_" :
                        nextIdStr = "advanced_atk_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_3rd_" :
                        nextIdStr = "advanced_atk_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_Ex_" :
                        nextIdStr = "advanced_atk_buff_3rd_";
                        recNumber++;
                        break;
                    case "advanced_atk_buff_1st_" :
                        nextIdStr = "advanced_atk_buff_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_def_debuff_2nd_" :
                        nextIdStr = "advanced_def_debuff_1st_";
                        recNumber++;
                        break;
                    case "advanced_def_debuff_3rd_" :
                        nextIdStr = "advanced_def_debuff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_def_debuff_Ex_" :
                        nextIdStr = "advanced_def_debuff_3rd_";
                        recNumber++;
                        break;
                    case "advanced_def_debuff_1st_" :
                        nextIdStr = "advanced_def_debuff_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_card_buff_2nd_" :
                        nextIdStr = "advanced_card_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_card_buff_3rd_" :
                        nextIdStr = "advanced_card_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_card_buff_1st_" :
                        nextIdStr = "advanced_card_buff_3rd_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_card_debuff_2nd_" :
                        nextIdStr = "advanced_card_debuff_1st_";
                        recNumber++;
                        break;
                    case "advanced_card_debuff_3rd_" :
                        nextIdStr = "advanced_card_debuff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_card_debuff_1st_" :
                        nextIdStr = "advanced_card_debuff_3rd_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_cri_buff_2nd_" :
                        nextIdStr = "advanced_cri_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_cri_buff_3rd_" :
                        nextIdStr = "advanced_cri_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_cri_buff_1st_" :
                        nextIdStr = "advanced_cri_buff_3rd_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_supereffective_buff_2nd_" :
                        nextIdStr = "advanced_supereffective_buff_1st_";
                        recNumber++;
                        break;
                    case "advanced_supereffective_buff_3rd_" :
                        nextIdStr = "advanced_supereffective_buff_2nd_";
                        recNumber++;
                        break;
                    case "advanced_supereffective_buff_Ex_" :
                        nextIdStr = "advanced_supereffective_buff_3rd_";
                        recNumber++;
                        break;
                    case "advanced_supereffective_buff_1st_" :
                        nextIdStr = "advanced_supereffective_buff_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_fixed_dmg_2nd_" :
                        nextIdStr = "advanced_fixed_dmg_1st_";
                        recNumber++;
                        break;
                    case "advanced_fixed_dmg_3rd_" :
                        nextIdStr = "advanced_fixed_dmg_2nd_";
                        recNumber++;
                        break;
                    case "advanced_fixed_dmg_Ex_" :
                        nextIdStr = "advanced_fixed_dmg_3rd_";
                        recNumber++;
                        break;
                    case "advanced_fixed_dmg_1st_" :
                        nextIdStr = "advanced_fixed_dmg_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    case "advanced_special_def_2nd_" :
                        nextIdStr = "advanced_special_def_1st_";
                        recNumber++;
                        break;
                    case "advanced_special_def_3rd_" :
                        nextIdStr = "advanced_special_def_2nd_";
                        recNumber++;
                        break;
                    case "advanced_special_def_Ex_" :
                        nextIdStr = "advanced_special_def_3rd_";
                        recNumber++;
                        break;
                    case "advanced_special_def_1st_" :
                        nextIdStr = "advanced_special_def_Ex_";
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
                    default :
                        nextIdStr = activeIdStr;
                        if (Number(splitStr[splitStr.length - 1]) == 0) {
                            // 1行目なら最終行に進む
                            recNumber = rowNumber + defaultRow - 1;
                        }
                        break;
               }
            }

            nextIdStr = nextIdStr + recNumber;
            nextObj = $("#" + nextIdStr);

            // フォーカス設定
            nextObj.focus();
        }  
    });

    // CSVの読み込み
    $.get("https://fategoplayer2.github.io/fgodamagecalculator/data/servant_data.csv", parseCsv, "text");

});

/**
 * CSV読込
 * @param data csvパス
 */
function parseCsv(data) {
    // CSVを配列で読み込む
    var csv = $.csv.toArrays(data);

    servantList = new Array();

    $(csv).each(function() {

        var servant = {};

        servant["No"] = this[0];
        servant["サーヴァント名"] = this[1];
        servant["クラス"] = this[2];
        servant["レアリティ"] = this[3];
        servant["BaseHP"] = this[4];
        servant["MaxHP"] = this[5];
        servant["BaseAtk"] = this[6];
        servant["MaxAtk"] = this[7];
        servant["天地人"] = this[8];
        servant["B_N/A"] = this[9];
        servant["A_N/A"] = this[10];
        servant["Q_N/A"] = this[11];
        servant["EX_N/A"] = this[12];
        servant["N_N/A"] = this[13];
        servant["N/D"] = this[14];
        servant["SR"] = this[15];
        servant["SW"] = this[16];
        servant["DR"] = this[17];
        servant["BHIT"] = this[18];
        servant["AHIT"] = this[19];
        servant["QHIT"] = this[20];
        servant["EXHIT"] = this[21];
        servant["宝具HIT"] = this[22];
        servant["カード"] = this[23];
        servant["宝具カード"] = this[24];
        servant["宝具タイプ"] = this[25];
        servant["宝具Lv1"] = this[26];
        servant["宝具Lv2"] = this[27];
        servant["宝具Lv3"] = this[28];
        servant["宝具Lv4"] = this[29];
        servant["宝具Lv5"] = this[30];
        servant["クラススキル_固定ダメージ"] = this[31];
        servant["クラススキル_Bバフ"] = this[32];
        servant["クラススキル_Aバフ"] = this[33];
        servant["クラススキル_Qバフ"] = this[34];
        servant["クラススキル_宝具バフ"] = this[35];
        servant["クラススキル_クリバフ"] = this[36];
        servant["クラススキル_Bクリバフ"] = this[37];
        servant["クラススキル_Aクリバフ"] = this[38];
        servant["クラススキル_Qクリバフ"] = this[39];
        servant["クラススキル_NP獲得バフ"] = this[40];
        servant["クラススキル_NP獲得Bバフ"] = this[41];
        servant["クラススキル_NP獲得Aバフ"] = this[42];
        servant["クラススキル_NP獲得Qバフ"] = this[43];
        servant["クラススキル_NP獲得被ダメ"] = this[44];
        servant["クラススキル_スター獲得バフ"] = this[45];
        servant["クラススキル_スター獲得Bバフ"] = this[46];
        servant["クラススキル_スター獲得Aバフ"] = this[47];
        servant["クラススキル_スター獲得Qバフ"] = this[48];
        servant["性別"] = this[49];
        servant["属性"] = this[50];
        servant["性格"] = this[51];
        servant["特性"] = this[52];
        servant["宝具名"] = this[53];
        servant["宝具効果"] = this[54].replaceAll("\\n","\n");
        servant["スキル1名"] = this[55];
        servant["スキル1CT"] = this[56];
        servant["スキル1効果"] = this[57].replaceAll("\\n","\n");
        servant["スキル2名"] = this[58];
        servant["スキル2CT"] = this[59];
        servant["スキル2効果"] = this[60].replaceAll("\\n","\n");
        servant["スキル3名"] = this[61];
        servant["スキル3CT"] = this[62];
        servant["スキル3効果"] = this[63].replaceAll("\\n","\n");
        servant["クラススキル1名"] = this[64];
        servant["クラススキル1効果"] = this[65].replaceAll("\\n","\n");
        servant["クラススキル2名"] = this[66];
        servant["クラススキル2効果"] = this[67].replaceAll("\\n","\n");
        servant["クラススキル3名"] = this[68];
        servant["クラススキル3効果"] = this[69].replaceAll("\\n","\n");
        servant["クラススキル4名"] = this[70];
        servant["クラススキル4効果"] = this[71].replaceAll("\\n","\n");
        servant["クラススキル5名"] = this[72];
        servant["クラススキル5効果"] = this[73].replaceAll("\\n","\n");
        servant["クラススキル6名"] = this[74];
        servant["クラススキル6効果"] = this[75].replaceAll("\\n","\n");
        servant["クラススキル7名"] = this[76];
        servant["クラススキル7効果"] = this[77].replaceAll("\\n","\n");
        servant["アペンド名"] = this[78];
        servant["アペンド効果"] = this[79];
        servant["絆礼装効果"] = this[80].replaceAll("\\n","\n");
        
        servantList.push(servant);

    });

    // サーヴァントセレクトボックスを作成
    remakeSearchServantSelectBox();
    remakeEnemySelectBox();
    remakeServantSelectBox();
    
}

/**
 * サーヴァント検索画面セレクトボックス再作成
 */
function remakeSearchServantSelectBox() {
    let className = $("#search_servant_class").val();
    let rarity = $("#search_servant_rare").val();

    if (className != "" || rarity != "") {
        // サーヴァントセレクトボックスを削除
        while ($("#search_servant_name")[0].lastChild) {
            $("#search_servant_name")[0].removeChild($("#search_servant_name")[0].lastChild);
        }

        // 指定されたクラスのみで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");

            if (className != "" && rarity != "") {
                if (this["クラス"] == className && this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#search_servant_name")[0].appendChild(option);
                }
            }
            else if (className != "" && rarity == "") {
                if (this["クラス"] == className) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#search_servant_name")[0].appendChild(option);
                }
            }
            else if (className == "" && rarity != "") {
                if (this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#search_servant_name")[0].appendChild(option);
                }
            }

        });
    }
    else {

        // サーヴァントセレクトボックスを削除
        while ($("#search_servant_name")[0].lastChild) {
            $("#search_servant_name")[0].removeChild($("#search_servant_name")[0].lastChild);
        }

        // 全てのサーヴァントで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");  
            option.value = this["No"];
            option.textContent = this["サーヴァント名"];
            $("#search_servant_name")[0].appendChild(option);
        });

    }
}

/**
 * エネミーセレクトボックス再作成
 */
function remakeEnemySelectBox() {
    let className = $("#servant-class-enemy").val();
    let rarity = $("#servant-rare-enemy").val();

    if (className != "" || rarity != "") {
        // サーヴァントセレクトボックスを削除
        while ($("#servant-name-enemy")[0].lastChild) {
            $("#servant-name-enemy")[0].removeChild($("#servant-name-enemy")[0].lastChild);
        }

        // 指定されたクラスのみで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");

            if (className != "" && rarity != "") {
                if (this["クラス"] == className && this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name-enemy")[0].appendChild(option);
                }
            }
            else if (className != "" && rarity == "") {
                if (this["クラス"] == className) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name-enemy")[0].appendChild(option);
                }
            }
            else if (className == "" && rarity != "") {
                if (this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name-enemy")[0].appendChild(option);
                }
            }

        });
    }
    else {

        // サーヴァントセレクトボックスを削除
        while ($("#servant-name-enemy")[0].lastChild) {
            $("#servant-name-enemy")[0].removeChild($("#servant-name-enemy")[0].lastChild);
        }

        // 全てのサーヴァントで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");  
            option.value = this["No"];
            option.textContent = this["サーヴァント名"];
            $("#servant-name-enemy")[0].appendChild(option);
        });

    }
}

/**
 * サーヴァントセレクトボックス再作成
 */
function remakeServantSelectBox() {
    let className = $("#servant-class").val();
    let rarity = $("#servant-rare").val();

    if (className != "" || rarity != "") {
        // サーヴァントセレクトボックスを削除
        while ($("#servant-name")[0].lastChild) {
            $("#servant-name")[0].removeChild($("#servant-name")[0].lastChild);
        }

        // 指定されたクラスのみで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");

            if (className != "" && rarity != "") {
                if (this["クラス"] == className && this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name")[0].appendChild(option);
                }
            }
            else if (className != "" && rarity == "") {
                if (this["クラス"] == className) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name")[0].appendChild(option);
                }
            }
            else if (className == "" && rarity != "") {
                if (this["レアリティ"] == rarity) {
                    option.value = this["No"];
                    option.textContent = this["サーヴァント名"];
                    $("#servant-name")[0].appendChild(option);
                }
            }

        });
    }
    else {

        // サーヴァントセレクトボックスを削除
        while ($("#servant-name")[0].lastChild) {
            $("#servant-name")[0].removeChild($("#servant-name")[0].lastChild);
        }

        // 全てのサーヴァントで再作成
        $(servantList).each(function() {
            var option = document.createElement("option");  
            option.value = this["No"];
            option.textContent = this["サーヴァント名"];
            $("#servant-name")[0].appendChild(option);
        });

    }
}

/**
 * パラメーター初期化
 * @param row 行番号
 */
function clearParam(row) {

    $("#atk_" + row).val("0");
    $("#np_dmg_" + row).val("450");
    $("#np_kind_" + row).val("A");
    $("#atk_buff_" + row).val("0");
    $("#def_debuff_" + row).val("0");
    $("#b_card_buff_" + row).val("0");
    $("#b_card_debuff_" + row).val("0");
    $("#b_card_cri_buff_" + row).val("0");
    $("#a_card_buff_" + row).val("0");
    $("#a_card_debuff_" + row).val("0");
    $("#a_card_cri_buff_" + row).val("0");
    $("#q_card_buff_" + row).val("0");
    $("#q_card_debuff_" + row).val("0");
    $("#q_card_cri_buff_" + row).val("0");
    $("#cri_buff_" + row).val("0");
    $("#np_buff_" + row).val("0");
    $("#supereffective_buff_" + row).val("0");
    $("#supereffective_np_" + row).val("100");
    $("#fixed_dmg_" + row).val("0");
    $("#special_def_" + row).val("0");
    $("#class_affinity_" + row).val("1.0");
    $("#attribute_affinity_" + row).val("1.0");
    $("#class_servant_" + row).val("1.00");
    $("#card_1st_" + row).val("A");
    $("#card_1st_cri_" + row).val("N");
    $("#card_2nd_" + row).val("A");
    $("#card_2nd_cri_" + row).val("N");
    $("#card_3rd_" + row).val("A");
    $("#card_3rd_cri_" + row).val("N");
    $("#dmg_min_1st_" + row).val("0");
    $("#dmg_ave_1st_" + row).val("0");
    $("#dmg_max_1st_" + row).val("0");
    $("#dmg_min_2nd_" + row).val("0");
    $("#dmg_ave_2nd_" + row).val("0");
    $("#dmg_max_2nd_" + row).val("0");
    $("#dmg_min_3rd_" + row).val("0");
    $("#dmg_ave_3rd_" + row).val("0");
    $("#dmg_max_3rd_" + row).val("0");
    $("#dmg_min_total_" + row).val("0");
    $("#dmg_ave_total_" + row).val("0");
    $("#dmg_max_total_" + row).val("0");

    $("#search_servant_no_" + row).val("");
    $("#search_servant_class_" + row).val("");
    $("#search_servant_rare_" + row).val("");
    $("#search_servant_lvl_" + row).val("");
    $("#search_servant_nplvl_" + row).val("");

    $("#prob_hp_" + row).val("0");
    $("#enemy_hp").val("0");
    $("#prob_recNumber").val("");

    $("#np_star_servant_no_" + row).val("");
    $("#np_star_servant_class_" + row).val("");
    $("#np_star_servant_rare_" + row).val("");
    $("#np_star_enemy_no_" + row).val("");
    $("#np_star_enemy_class_" + row).val("");
    $("#np_star_enemy_rare_" + row).val("");
    $("#nd_" + row).val("0");
    $("#na_buff_" + row).val("0");
    $("#nd_buff_" + row).val("0");
    $("#b_hit_" + row).val("1");
    $("#a_hit_" + row).val("1");
    $("#q_hit_" + row).val("1");
    $("#np_hit_" + row).val("1");
    $("#na_enemy_" + row).val("剣");

    // サーヴァント画像変更
    setServantImage(row, "");

}

/**
 * パラメーター初期化（テーブルのみ）
 * @param row 行番号
 */
function clearParamTable(row) {

    $("#atk_" + row).val("0");
    $("#np_dmg_" + row).val("450");
    $("#np_kind_" + row).val("A");
    $("#atk_buff_" + row).val("0");
    $("#def_debuff_" + row).val("0");
    $("#b_card_buff_" + row).val("0");
    $("#b_card_debuff_" + row).val("0");
    $("#b_card_cri_buff_" + row).val("0");
    $("#a_card_buff_" + row).val("0");
    $("#a_card_debuff_" + row).val("0");
    $("#a_card_cri_buff_" + row).val("0");
    $("#q_card_buff_" + row).val("0");
    $("#q_card_debuff_" + row).val("0");
    $("#q_card_cri_buff_" + row).val("0");
    $("#cri_buff_" + row).val("0");
    $("#np_buff_" + row).val("0");
    $("#supereffective_buff_" + row).val("0");
    $("#supereffective_np_" + row).val("100");
    $("#fixed_dmg_" + row).val("0");
    $("#special_def_" + row).val("0");
    $("#class_affinity_" + row).val("1.0");
    $("#attribute_affinity_" + row).val("1.0");
    $("#class_servant_" + row).val("1.00");
    $("#card_1st_" + row).val("A");
    $("#card_1st_cri_" + row).val("N");
    $("#card_2nd_" + row).val("A");
    $("#card_2nd_cri_" + row).val("N");
    $("#card_3rd_" + row).val("A");
    $("#card_3rd_cri_" + row).val("N");
    $("#dmg_min_1st_" + row).val("0");
    $("#dmg_ave_1st_" + row).val("0");
    $("#dmg_max_1st_" + row).val("0");
    $("#dmg_min_2nd_" + row).val("0");
    $("#dmg_ave_2nd_" + row).val("0");
    $("#dmg_max_2nd_" + row).val("0");
    $("#dmg_min_3rd_" + row).val("0");
    $("#dmg_ave_3rd_" + row).val("0");
    $("#dmg_max_3rd_" + row).val("0");
    $("#dmg_min_total_" + row).val("0");
    $("#dmg_ave_total_" + row).val("0");
    $("#dmg_max_total_" + row).val("0");

    $("#b_hit_" + row).val("1");
    $("#a_hit_" + row).val("1");
    $("#q_hit_" + row).val("1");
    $("#np_hit_" + row).val("1");
    $("#na_enemy_" + row).val("剣");

    // サーヴァント画像変更
    setServantImage(row, "");

}

/**
 * 選択トータル初期化
 */
 function clearSelTotal() {

    selDamageTotal = 0;
    selDamageNum = 0;
    $(".sel_total").css({"display":""})
    $("#out_sel_total").val("0");
    $(".wrap_dmg_result").css({"background":""});
 }

 /**
 * サーヴァント画像変更
 * @param recNumber 行番号
 * @param servantNo サーヴァントNo
 */
function setServantImage(recNumber, servantNo){

    try {
        if (servantNo == ""){
            $("#servant_img_default_" + recNumber).removeClass("d-none");
            $("#sevant_face_img_" + recNumber)[0].src = "";
            $("#servant_img_select_" + recNumber).addClass("d-none");
        }
        else {
            $("#servant_img_select_" + recNumber).removeClass("d-none");
            $("#sevant_face_img_" + recNumber)[0].src = "../img/servant_face/" + servantNo + ".png"
            $("#servant_img_default_" + recNumber).addClass("d-none");
        }
    }
    catch {
    }
    
}

/**
 * エネミー情報反映
 * @return result 計算可能or不可能
 */
function enemyApply() {

    var result = false;

    if ($("#servant-name-enemy").val() != null) {

        $(servantList).each(function() {
            
            if ($("#servant-name-enemy").val() == this["No"]) {

                $("#b_hit").val(this["BHIT"]);
                $("#a_hit").val(this["AHIT"]);
                $("#q_hit").val(this["QHIT"]);
                $("#np_hit").val(this["宝具HIT"]);
                $("#NA_enemy").val(this["クラス"]);

                return;

            }

        });

        result = true;

    }

    return result;

}

/**
 * サーヴァント情報反映
 * @return result 計算可能or不可能
 */
function servantApply() {

    var result = false;

    if ($("#servant-name").val() != null) {

        $(servantList).each(function() {
            
            if ($("#servant-name").val() == this["No"]) {

                $("#ND").val(this["N/D"]);
                $("#NA_buff").val(this["クラススキル_NP獲得バフ"]);
                $("#ND_buff").val(this["クラススキル_NP獲得被ダメ"]);

                return;

            }

        });

        result = true;

    }

    return result;

}

/**
 * サーヴァント情報表示
 */
function servantInfo() {
    var servantNo = $("#search_servant_name").val();

    if (servantNo == null){
        // HP ATK
        $("#servant_search_hp")[0].innerText = "";
        $("#servant_search_atk")[0].innerText = "";
        // 天地人
        $("#servant_search_attribute")[0].innerText = "";
        // 属性
        $("#servant_search_alignment")[0].innerText = "";
        // カード
        $("#servant_search_deck")[0].innerText = "";
        // ヒット数
        $("#servant_search_nit")[0].innerText = "";
        // NP獲得率 スター発生率
        $("#servant_search_npGein")[0].innerText = "";
        $("#servant_search_starGen")[0].innerText = "";
        // 宝具
        $("#servant_search_np")[0].innerText = "";
        // スキル
        $("#servant_search_skill1")[0].innerText = "";
        $("#servant_search_skill2")[0].innerText = "";
        $("#servant_search_skill3")[0].innerText = "";
        // クラススキル
        let classSkill = "";
        $("#servant_search_classSkill")[0].innerText = "";
        // アペンドスキル
        $("#servant_search_appendSkill")[0].innerText = "";
        // 絆
        $("#servant_search_bondCE")[0].innerText = "";
        // 特性
        $("#servant_search_trait")[0].innerText = "";
        return;
    }

    $(servantList).each(function() {

        if (this["No"] == servantNo) {

            var hp,atk;

            switch ($("#search_servant_lvl").val()) {
                case "MAX" :
                    hp = Number(this["MaxHP"]);
                    atk = Number(this["MaxAtk"]);
                    break;
                case "100" :
                    hp = rounddown(Number(this["BaseHP"]) 
                        + (Number(this["MaxHP"]) - Number(this["BaseHP"])) 
                        * Number(correctio_lv100[Number(this["レアリティ"])]),0);
                    atk = rounddown(Number(this["BaseAtk"]) 
                        + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                        * Number(correctio_lv100[Number(this["レアリティ"])]),0);
                    break;
                case "110" :
                    hp = rounddown(Number(this["BaseHP"]) 
                        + (Number(this["MaxHP"]) - Number(this["BaseHP"])) 
                        * Number(correctio_lv110[Number(this["レアリティ"])]),0);
                    atk = rounddown(Number(this["BaseAtk"]) 
                        + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                        * Number(correctio_lv110[Number(this["レアリティ"])]),0);
                    break;
                case "120" :
                    hp = rounddown(Number(this["BaseHP"]) 
                        + (Number(this["MaxHP"]) - Number(this["BaseHP"])) 
                        * Number(correctio_lv120[Number(this["レアリティ"])]),0);
                    atk = rounddown(Number(this["BaseAtk"]) 
                        + (Number(this["MaxAtk"]) - Number(this["BaseAtk"])) 
                        * Number(correctio_lv120[Number(this["レアリティ"])]),0);
                    break;
                default :
                    break;
            }

            // HP ATK
            $("#servant_search_hp")[0].innerText = Number(hp).toLocaleString();
            $("#servant_search_atk")[0].innerText = Number(atk).toLocaleString();
            // 天地人
            $("#servant_search_attribute")[0].innerText = this["天地人"];
            // 属性
            $("#servant_search_alignment")[0].innerText = this["属性"] + "/" + this["性格"];
            // カード
            $("#servant_search_deck")[0].innerText = "Q：" + (this["カード"].match( new RegExp("Q", "g") ) || []).length + "枚/A：" + (this["カード"].match( new RegExp("A", "g") ) || []).length + "枚/B：" + (this["カード"].match( new RegExp("B", "g") ) || []).length + "枚";
            // ヒット数
            $("#servant_search_nit")[0].innerText = "Q：" + this["QHIT"] + "HIT/A：" + this["AHIT"] + "HIT/B：" + this["BHIT"] + "HIT/EX：" + this["EXHIT"] + "HIT/宝具：" + this["宝具HIT"] + "HIT";
            // NP獲得率 スター発生率
            $("#servant_search_npGein")[0].innerText = this["N_N/A"];
            $("#servant_search_starGen")[0].innerText = this["SR"];
            // 宝具
            let np_kind;
            let np_lvl;
            switch (this["宝具カード"]) {
                case "B" :
                    np_kind = "Buster"
                    break;
                case "A" :
                    np_kind = "Arts"
                    break;
                case "Q" :
                    np_kind = "Quick"
                    break;
                default :
                    break;
            }
            switch ($("#search_servant_nplvl").val()) {
                case "1" :
                    np_lvl = this["宝具Lv1"];
                    break;
                case "2" :
                    np_lvl = this["宝具Lv2"];
                    break;
                case "3" :
                    np_lvl = this["宝具Lv3"];
                    break;
                case "4" :
                    np_lvl = this["宝具Lv4"];
                    break;
                case "5" :
                    np_lvl = this["宝具Lv5"];
                    break;
                default :
                    break;
            }
            let np = "【" + this["宝具名"] + "】 種類：" + np_kind + "\n" + this["宝具効果"].replaceAll("$","LV" + $("#search_servant_nplvl").val() + ":" + np_lvl);
            $("#servant_search_np")[0].innerText = np;
            // スキル
            let skill1 = "【" + this["スキル1名"] + "】 CT：" + this["スキル1CT"] + "→" + Number(Number(this["スキル1CT"]) - 2) + "\n" + this["スキル1効果"];
            $("#servant_search_skill1")[0].innerText = skill1;
            let skill2 = "【" + this["スキル2名"] + "】 CT：" + this["スキル2CT"] + "→" + Number(Number(this["スキル2CT"]) - 2) + "\n" + this["スキル2効果"];
            $("#servant_search_skill2")[0].innerText = skill2;
            let skill3 = "【" + this["スキル3名"] + "】 CT：" + this["スキル3CT"] + "→" + Number(Number(this["スキル3CT"]) - 2) + "\n" + this["スキル3効果"];
            $("#servant_search_skill3")[0].innerText = skill3;
            // クラススキル
            let classSkill = "";
            if (this["クラススキル1名"] != "") {classSkill += "【" + this["クラススキル1名"] + "】" + "\n" + this["クラススキル1効果"];}
            if (this["クラススキル2名"] != "") {classSkill += "\n" + "【" + this["クラススキル2名"] + "】" + "\n" + this["クラススキル2効果"];}
            if (this["クラススキル3名"] != "") {classSkill += "\n" + "【" + this["クラススキル3名"] + "】" + "\n" + this["クラススキル3効果"];}
            if (this["クラススキル4名"] != "") {classSkill += "\n" + "【" + this["クラススキル4名"] + "】" + "\n" + this["クラススキル4効果"];}
            if (this["クラススキル5名"] != "") {classSkill += "\n" + "【" + this["クラススキル5名"] + "】" + "\n" + this["クラススキル5効果"];}
            if (this["クラススキル6名"] != "") {classSkill += "\n" + "【" + this["クラススキル6名"] + "】" + "\n" + this["クラススキル6効果"];}
            if (this["クラススキル7名"] != "") {classSkill += "\n" + "【" + this["クラススキル7名"] + "】" + "\n" + this["クラススキル7効果"];}
            $("#servant_search_classSkill")[0].innerText = classSkill;
            // アペンドスキル
            let appendSkill = "【" + this["アペンド名"] + "】" + "\n" + this["アペンド効果"];
            $("#servant_search_appendSkill")[0].innerText = appendSkill;
            // 絆
            $("#servant_search_bondCE")[0].innerText = this["絆礼装効果"];
            // 特性
            $("#servant_search_trait")[0].innerText = this["特性"];

            return;
        }

    });
}

/**
 * 行コピー
 * @param recNumber コピー元行
 * @param recNext コピー先行
 */
function copyParam(recNumber, recNext){
    $("#atk_" + recNext).val($("#atk_" + recNumber).val());
    $("#np_dmg_" + recNext).val($("#np_dmg_" + recNumber).val());
    $("#np_kind_" + recNext).val($("#np_kind_" + recNumber).val());
    $("#atk_buff_" + recNext).val($("#atk_buff_" + recNumber).val());
    $("#def_debuff_" + recNext).val($("#def_debuff_" + recNumber).val());
    $("#b_card_buff_" + recNext).val($("#b_card_buff_" + recNumber).val());
    $("#b_card_debuff_" + recNext).val($("#b_card_debuff_" + recNumber).val());
    $("#b_card_cri_buff_" + recNext).val($("#b_card_cri_buff_" + recNumber).val());
    $("#a_card_buff_" + recNext).val($("#a_card_buff_" + recNumber).val());
    $("#a_card_debuff_" + recNext).val($("#a_card_debuff_" + recNumber).val());
    $("#a_card_cri_buff_" + recNext).val($("#a_card_cri_buff_" + recNumber).val());
    $("#q_card_buff_" + recNext).val($("#q_card_buff_" + recNumber).val());
    $("#q_card_debuff_" + recNext).val($("#q_card_debuff_" + recNumber).val());
    $("#q_card_cri_buff_" + recNext).val($("#q_card_cri_buff_" + recNumber).val());
    $("#cri_buff_" + recNext).val($("#cri_buff_" + recNumber).val());
    $("#np_buff_" + recNext).val($("#np_buff_" + recNumber).val());
    $("#supereffective_buff_" + recNext).val($("#supereffective_buff_" + recNumber).val());
    $("#supereffective_np_" + recNext).val($("#supereffective_np_" + recNumber).val());
    $("#fixed_dmg_" + recNext).val($("#fixed_dmg_" + recNumber).val());
    $("#special_def_" + recNext).val($("#special_def_" + recNumber).val());
    $("#class_affinity_" + recNext).val($("#class_affinity_" + recNumber).val());
    $("#attribute_affinity_" + recNext).val($("#attribute_affinity_" + recNumber).val());
    $("#class_servant_" + recNext).val($("#class_servant_" + recNumber).val());
    $("#card_1st_" + recNext).val($("#card_1st_" + recNumber).val());
    $("#card_1st_cri_" + recNext).val($("#card_1st_cri_" + recNumber).val());
    $("#card_2nd_" + recNext).val($("#card_2nd_" + recNumber).val());
    $("#card_2nd_cri_" + recNext).val($("#card_2nd_cri_" + recNumber).val());
    $("#card_3rd_" + recNext).val($("#card_3rd_" + recNumber).val());
    $("#card_3rd_cri_" + recNext).val($("#card_3rd_cri_" + recNumber).val());

    $("#search_servant_no_" + recNext).val( $("#search_servant_no_" + recNumber).val());
    $("#search_servant_class_" + recNext).val($("#search_servant_class_" + recNumber).val());
    $("#search_servant_rare_" + recNext).val($("#search_servant_rare_" + recNumber).val());
    $("#search_servant_lvl_" + recNext).val($("#search_servant_lvl_" + recNumber).val());
    $("#search_servant_nplvl_" + recNext).val($("#search_servant_nplvl_" + recNumber).val());

    $("#prob_hp_" + recNext).val($("#prob_hp_" + recNumber).val());

    $("#np_star_servant_no_" + recNext).val($("#np_star_servant_no_" + recNumber).val());
    $("#np_star_servant_class_" + recNext).val($("#np_star_servant_class_" + recNumber).val());
    $("#np_star_servant_rare_" + recNext).val($("#np_star_servant_rare_" + recNumber).val());
    $("#np_star_enemy_no_" + recNext).val($("#np_star_enemy_no_" + recNumber).val());
    $("#np_star_enemy_class_" + recNext).val($("#np_star_enemy_class_" + recNumber).val());
    $("#np_star_enemy_rare_" + recNext).val($("#np_star_enemy_rare_" + recNumber).val());
    $("#nd_" + recNext).val($("#nd_" + recNumber).val());
    $("#na_buff_" + recNext).val($("#na_buff_" + recNumber).val());
    $("#nd_buff_" + recNext).val($("#nd_buff_" + recNumber).val());
    $("#b_hit_" + recNext).val($("#b_hit_" + recNumber).val());
    $("#a_hit_" + recNext).val($("#a_hit_" + recNumber).val());
    $("#q_hit_" + recNext).val($("#q_hit_" + recNumber).val());
    $("#np_hit_" + recNext).val($("#np_hit_" + recNumber).val());
    $("#na_enemy_" + recNext).val($("#na_enemy_" + recNumber).val());

    // サーヴァント画像変更
    setServantImage(recNext, $("#search_servant_no_" + recNumber).val());

}

/**
 * 行入れ替え
 * @param recNumber 入れ替え元行
 * @param recNext 入れ替え先行
 */
function changeParam(recNumber, recNext){
    var atk,np_dmg,np_kind,atk_buff,def_debuff, b_card_buff,b_card_cri_buff,a_card_buff,a_card_cri_buff,q_card_buff,q_card_cri_buff,cri_buff,
    b_card_debuff, a_card_debuff, q_card_debuff,np_buff,supereffective_buff,supereffective_np,fixed_dmg,special_def,
    class_affinity,attribute_affinity,class_servant,card_1st,card_1st_cri,card_2nd,card_2nd_cri,card_3rd,card_3rd_cri,
    search_servant_no,search_servant_class,search_servant_rare,search_servant_lvl,search_servant_nplvl,prob_hp,
    np_star_servant_no, np_star_servant_class, np_star_servant_rare, np_star_enemy_no, np_star_enemy_class, np_star_enemy_rare,
    nd, na_buff, nd_buff, b_hit, a_hit, q_hit, np_hit, na_enemy;

    atk = $("#atk_" + recNext).val();
    np_dmg = $("#np_dmg_" + recNext).val();
    np_kind = $("#np_kind_" + recNext).val();
    atk_buff = $("#atk_buff_" + recNext).val();
    def_debuff = $("#def_debuff_" + recNext).val();
    b_card_buff = $("#b_card_buff_" + recNext).val();
    b_card_debuff = $("#b_card_debuff_" + recNext).val();
    b_card_cri_buff = $("#b_card_cri_buff_" + recNext).val();
    a_card_buff = $("#a_card_buff_" + recNext).val();
    a_card_debuff = $("#a_card_debuff_" + recNext).val();
    a_card_cri_buff = $("#a_card_cri_buff_" + recNext).val();
    q_card_buff = $("#q_card_buff_" + recNext).val();
    q_card_debuff = $("#q_card_debuff_" + recNext).val();
    q_card_cri_buff = $("#q_card_cri_buff_" + recNext).val();
    cri_buff = $("#cri_buff_" + recNext).val();
    np_buff = $("#np_buff_" + recNext).val();
    supereffective_buff = $("#supereffective_buff_" + recNext).val();
    supereffective_np = $("#supereffective_np_" + recNext).val();
    fixed_dmg = $("#fixed_dmg_" + recNext).val();
    special_def = $("#special_def_" + recNext).val();
    class_affinity = $("#class_affinity_" + recNext).val();
    attribute_affinity = $("#attribute_affinity_" + recNext).val();
    class_servant = $("#class_servant_" + recNext).val();
    card_1st = $("#card_1st_" + recNext).val();
    card_1st_cri = $("#card_1st_cri_" + recNext).val();
    card_2nd = $("#card_2nd_" + recNext).val();
    card_2nd_cri = $("#card_2nd_cri_" + recNext).val();
    card_3rd = $("#card_3rd_" + recNext).val();
    card_3rd_cri = $("#card_3rd_cri_" + recNext).val();

    search_servant_no = $("#search_servant_no_" + recNext).val();
    search_servant_class = $("#search_servant_class_" + recNext).val();
    search_servant_rare = $("#search_servant_rare_" + recNext).val();
    search_servant_lvl = $("#search_servant_lvl_" + recNext).val();
    search_servant_nplvl = $("#search_servant_nplvl_" + recNext).val();

    prob_hp = $("#prob_hp_" + recNext).val();

    np_star_servant_no = $("#np_star_servant_no_" + recNext).val();
    np_star_servant_class = $("#np_star_servant_class_" + recNext).val();
    np_star_servant_rare = $("#np_star_servant_rare_" + recNext).val();
    np_star_enemy_no = $("#np_star_enemy_no_" + recNext).val();
    np_star_enemy_class = $("#np_star_enemy_class_" + recNext).val();
    np_star_enemy_rare = $("#np_star_enemy_rare_" + recNext).val();
    nd = $("#nd_" + recNext).val();
    na_buff = $("#na_buff_" + recNext).val();
    nd_buff = $("#nd_buff_" + recNext).val();
    b_hit = $("#b_hit_" + recNext).val();
    a_hit = $("#a_hit_" + recNext).val();
    q_hit = $("#q_hit_" + recNext).val();
    np_hit = $("#np_hit_" + recNext).val();
    na_enemy = $("#na_enemy_" + recNext).val();

    // コピー
    copyParam(recNumber, recNext);
    
    $("#atk_" + recNumber).val(atk);
    $("#np_dmg_" + recNumber).val(np_dmg);
    $("#np_kind_" + recNumber).val(np_kind);
    $("#atk_buff_" + recNumber).val(atk_buff);
    $("#def_debuff_" + recNumber).val(def_debuff);
    $("#b_card_buff_" + recNumber).val(b_card_buff);
    $("#b_card_debuff_" + recNumber).val(b_card_debuff);
    $("#b_card_cri_buff_" + recNumber).val(b_card_cri_buff);
    $("#a_card_buff_" + recNumber).val(a_card_buff);
    $("#a_card_debuff_" + recNumber).val(a_card_debuff);
    $("#a_card_cri_buff_" + recNumber).val(a_card_cri_buff);
    $("#q_card_buff_" + recNumber).val(q_card_buff);
    $("#q_card_debuff_" + recNumber).val(q_card_debuff);
    $("#q_card_cri_buff_" + recNumber).val(q_card_cri_buff);
    $("#cri_buff_" + recNumber).val(cri_buff);
    $("#np_buff_" + recNumber).val(np_buff);
    $("#supereffective_buff_" + recNumber).val(supereffective_buff);
    $("#supereffective_np_" + recNumber).val(supereffective_np);
    $("#fixed_dmg_" + recNumber).val(fixed_dmg);
    $("#special_def_" + recNumber).val(special_def);
    $("#class_affinity_" + recNumber).val(class_affinity);
    $("#attribute_affinity_" + recNumber).val(attribute_affinity);
    $("#class_servant_" + recNumber).val(class_servant);
    $("#card_1st_" + recNumber).val(card_1st);
    $("#card_1st_cri_" + recNumber).val(card_1st_cri);
    $("#card_2nd_" + recNumber).val(card_2nd);
    $("#card_2nd_cri_" + recNumber).val(card_2nd_cri);
    $("#card_3rd_" + recNumber).val(card_3rd);
    $("#card_3rd_cri_" + recNumber).val(card_3rd_cri);

    $("#search_servant_no_" + recNumber).val(search_servant_no);
    $("#search_servant_class_" + recNumber).val(search_servant_class);
    $("#search_servant_rare_" + recNumber).val(search_servant_rare);
    $("#search_servant_lvl_" + recNumber).val(search_servant_lvl);
    $("#search_servant_nplvl_" + recNumber).val(search_servant_nplvl);
    
    $("#prob_hp_" + recNumber).val(prob_hp);

    $("#np_star_servant_no_" + recNumber).val(np_star_servant_no);
    $("#np_star_servant_class_" + recNumber).val(np_star_servant_class);
    $("#np_star_servant_rare_" + recNumber).val(np_star_servant_rare);
    $("#np_star_enemy_no_" + recNumber).val(np_star_enemy_no);
    $("#np_star_enemy_class_" + recNumber).val(np_star_enemy_class);
    $("#np_star_enemy_rare_" + recNumber).val(np_star_enemy_rare);
    $("#nd_" + recNumber).val(nd);
    $("#na_buff_" + recNumber).val(na_buff);
    $("#nd_buff_" + recNumber).val(nd_buff);
    $("#b_hit_" + recNumber).val(b_hit);
    $("#a_hit_" + recNumber).val(a_hit);
    $("#q_hit_" + recNumber).val(q_hit);
    $("#np_hit_" + recNumber).val(np_hit);
    $("#na_enemy_" + recNumber).val(na_enemy);

    // サーヴァント画像変更
    setServantImage(recNumber, search_servant_no);
        
}

/**
 * 計算メイン処理
 * @param recNumber 計算対象行
 */
function calcMain(recNumber) {
    var atk, np_dmg, np_kind, atk_buff, def_debuff, b_card_buff, b_card_debuff, a_card_buff, a_card_debuff, q_card_buff, q_card_debuff,
    cri_buff, b_card_cri_buff, a_card_cri_buff, q_card_cri_buff, np_buff, supereffective_buff, supereffective_np, fixed_dmg,
    special_def,class_affinity, attribute_affinity, class_servant, card_1st, card_1st_cri, card_2nd, card_2nd_cri, card_3rd, card_3rd_cri,
    bbonus_1st, bbonus_2nd, bbonus_3rd, bbonus_all, bchain_bonus, atk_1st, atk_2nd, atk_3rd, card_buff_1st, card_buff_2nd, card_buff_3rd,
    supereffective_buff_1st, supereffective_buff_2nd, supereffective_buff_3rd,
    fixed_dmg_1st, fixed_dmg_2nd, fixed_dmg_3rd, special_def_1st, special_def_2nd, special_def_3rd,
    atk_buff_1st, atk_buff_2nd, atk_buff_3rd, 
    cri_buff_1st, cri_buff_2nd, cri_buff_3rd, np_card_buff,
    dmg_ave_1st, dmg_ave_2nd, dmg_ave_3rd,
    dmg_max_1st, dmg_max_2nd, dmg_max_3rd,
    dmg_min_1st, dmg_min_2nd, dmg_min_3rd,
    dmg_cri_ave_1st, dmg_cri_ave_2nd, dmg_cri_ave_3rd,
    dmg_cri_max_1st, dmg_cri_max_2nd, dmg_cri_max_3rd,
    dmg_cri_min_1st, dmg_cri_min_2nd, dmg_cri_min_3rd;

    // 計算パラメーター取得
    atk = parseFloat($("#atk_" + recNumber).val());
    np_dmg = parseFloat($("#np_dmg_" + recNumber).val());
    np_kind = $("#np_kind_" + recNumber).val();
    atk_buff = parseFloat($("#atk_buff_" + recNumber).val());
    def_debuff = parseFloat($("#def_debuff_" + recNumber).val());
    b_card_buff = parseFloat($("#b_card_buff_" + recNumber).val());
    b_card_debuff = parseFloat($("#b_card_debuff_" + recNumber).val());
    b_card_cri_buff = parseFloat($("#b_card_cri_buff_" + recNumber).val());
    a_card_buff = parseFloat($("#a_card_buff_" + recNumber).val());
    a_card_debuff = parseFloat($("#a_card_debuff_" + recNumber).val());
    a_card_cri_buff = parseFloat($("#a_card_cri_buff_" + recNumber).val());
    q_card_buff = parseFloat($("#q_card_buff_" + recNumber).val());
    q_card_debuff = parseFloat($("#q_card_debuff_" + recNumber).val());
    q_card_cri_buff = parseFloat($("#q_card_cri_buff_" + recNumber).val());
    cri_buff = parseFloat($("#cri_buff_" + recNumber).val());
    np_buff = parseFloat($("#np_buff_" + recNumber).val());
    supereffective_buff = parseFloat($("#supereffective_buff_" + recNumber).val());
    supereffective_np = parseFloat($("#supereffective_np_" + recNumber).val());
    fixed_dmg = parseFloat($("#fixed_dmg_" + recNumber).val());
    special_def = parseFloat($("#special_def_" + recNumber).val());
    class_affinity = parseFloat($("#class_affinity_" + recNumber).val());
    attribute_affinity = parseFloat($("#attribute_affinity_" + recNumber).val());
    class_servant = parseFloat($("#class_servant_" + recNumber).val());
    card_1st = $("#card_1st_" + recNumber).val();
    card_1st_cri = $("#card_1st_cri_" + recNumber).val();
    card_2nd = $("#card_2nd_" + recNumber).val();
    card_2nd_cri = $("#card_2nd_cri_" + recNumber).val();
    card_3rd = $("#card_3rd_" + recNumber).val();
    card_3rd_cri = $("#card_3rd_cri_" + recNumber).val();

    bbonus_all = 0; bchain_bonus = 0;

    if (atk_buff > 400) {atk_buff = 400; };
    if (atk_buff < -100) {atk_buff = -100; };
    if (def_debuff > 100) {def_debuff = 100; };
    if (b_card_buff > 400) {b_card_buff = 400; };
    if (b_card_buff < -100) {b_card_buff = -100; };
    if (a_card_buff > 400) {a_card_buff = 400; };
    if (a_card_buff < -100) {a_card_buff = -100; };
    if (q_card_buff > 400) {q_card_buff = 400; };
    if (q_card_buff < -100) {q_card_buff = -100; };
    if (supereffective_buff > 1000) {supereffective_buff = 1000; };
    if (np_buff > 500) {np_buff = 500; };
    if (np_buff < -100) {np_buff = -100; };

    // カード選択ボーナスを設定
    // 1st
    if (card_1st == "Q") {
        bbonus_1st = 80;
        card_buff_1st = q_card_buff + q_card_debuff;
        if (cri_buff + q_card_cri_buff > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + q_card_cri_buff;
        }
    }
    if (card_1st == "A") {
        bbonus_1st = 100;
        card_buff_1st = a_card_buff + a_card_debuff;
        if (cri_buff + a_card_cri_buff > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + a_card_cri_buff;
        }
    }
    if (card_1st == "B") {
        bbonus_1st = 150;
        card_buff_1st = b_card_buff + b_card_debuff;
        if (cri_buff + b_card_cri_buff > 500){
            cri_buff_1st = 500;
        }
        else {
            cri_buff_1st = cri_buff + b_card_cri_buff;
        }
    }
    if (card_1st == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + q_card_debuff;
        bbonus_1st = 80;
        card_buff_1st = q_card_buff + q_card_debuff;
    }
    if (card_1st == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + a_card_debuff;
        bbonus_1st = 100;
        card_buff_1st = a_card_buff + a_card_debuff;
    }
    if (card_1st == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + b_card_debuff;
        bbonus_1st = 150;
        card_buff_1st = b_card_buff + b_card_debuff;
    }
    // 2nd
    if (card_2nd == "Q") {
        bbonus_2nd = 80;
        card_buff_2nd = q_card_buff + q_card_debuff;
        if (cri_buff + q_card_cri_buff > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + q_card_cri_buff;
        }
    }
    if (card_2nd == "A") {
        bbonus_2nd = 100;
        card_buff_2nd = a_card_buff + a_card_debuff;
        if (cri_buff + a_card_cri_buff > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + a_card_cri_buff;
        }
    }
    if (card_2nd == "B") {
        bbonus_2nd = 150;
        card_buff_2nd = b_card_buff + b_card_debuff;
        if (cri_buff + b_card_cri_buff > 500){
            cri_buff_2nd = 500;
        }
        else {
            cri_buff_2nd = cri_buff + b_card_cri_buff;
        }
    }
    if (card_2nd == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + q_card_debuff;
        bbonus_2nd = 80;
        card_buff_2nd = q_card_buff + q_card_debuff;
    }
    if (card_2nd == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + a_card_debuff;
        bbonus_2nd = 100;
        card_buff_2nd = a_card_buff + a_card_debuff;
    }
    if (card_2nd == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + b_card_debuff;
        bbonus_2nd = 150;
        card_buff_2nd = b_card_buff + b_card_debuff;
    }
    // 3rd
    if (card_3rd == "Q") {
        bbonus_3rd = 80;
        card_buff_3rd = q_card_buff + q_card_debuff;
        if (cri_buff + q_card_cri_buff > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + q_card_cri_buff;
        }
    }
    if (card_3rd == "A") {
        bbonus_3rd = 100;
        card_buff_3rd = a_card_buff + a_card_debuff;
        if (cri_buff + a_card_cri_buff > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + a_card_cri_buff;
        }
    }
    if (card_3rd == "B") {
        bbonus_3rd = 150;
        card_buff_3rd = b_card_buff + b_card_debuff;
        if (cri_buff + b_card_cri_buff > 500){
            cri_buff_3rd = 500;
        }
        else {
            cri_buff_3rd = cri_buff + b_card_cri_buff;
        }
    }
    if (card_3rd == "NP" && np_kind == "Q") {
        np_card_buff = q_card_buff + q_card_debuff;
        bbonus_3rd = 80;
        card_buff_3rd = q_card_buff + q_card_debuff;
    }
    if (card_3rd == "NP" && np_kind == "A") {
        np_card_buff = a_card_buff + a_card_debuff;
        bbonus_3rd = 100;
        card_buff_3rd = a_card_buff + a_card_debuff;
    }
    if (card_3rd == "NP" && np_kind == "B") {
        np_card_buff = b_card_buff + b_card_debuff;
        bbonus_3rd = 150;
        card_buff_3rd = b_card_buff + b_card_debuff;
    }
    // 1st共通
    atk_1st = atk;
    atk_buff_1st = atk_buff + def_debuff;
    supereffective_buff_1st = supereffective_buff;
    fixed_dmg_1st = fixed_dmg;
    special_def_1st = special_def;
    // 2nd共通
    atk_2nd = atk;
    atk_buff_2nd = atk_buff + def_debuff;
    supereffective_buff_2nd = supereffective_buff;
    fixed_dmg_2nd = fixed_dmg;
    special_def_2nd = special_def;
    // 3rd共通
    atk_3rd = atk;
    atk_buff_3rd = atk_buff + def_debuff;
    supereffective_buff_3rd = supereffective_buff;
    fixed_dmg_3rd = fixed_dmg;
    special_def_3rd = special_def;

    // 1st計算
    if (card_1st == "NP") {
        dmg_ave_1st = calcNpDmg(atk, np_dmg, np_kind, card_buff_1st, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 1);
        dmg_min_1st = calcNpDmg(atk, np_dmg, np_kind, card_buff_1st, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 0.9);
        dmg_max_1st = calcNpDmg(atk, np_dmg, np_kind, card_buff_1st, class_affinity, class_servant, attribute_affinity, atk_buff_1st,
            supereffective_buff_1st, np_buff, supereffective_np, fixed_dmg_1st, special_def_1st, 1.099);
    } else {
        dmg_ave_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1);
        dmg_min_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 0.9);
        dmg_max_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1.099);
        dmg_cri_ave_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1);
        dmg_cri_min_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 0.9);
        dmg_cri_max_1st = calcDmg(atk_1st, atk_buff_1st, card_buff_1st, cri_buff_1st, bbonus_1st, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_1st, special_def_1st, fixed_dmg_1st, 1.099);
    };

    // 2nd計算
    if (card_2nd == "NP") {
        dmg_ave_2nd = calcNpDmg(atk, np_dmg, np_kind, card_buff_2nd, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 1);
        dmg_min_2nd = calcNpDmg(atk, np_dmg, np_kind, card_buff_2nd, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 0.9);
        dmg_max_2nd = calcNpDmg(atk, np_dmg, np_kind, card_buff_2nd, class_affinity, class_servant, attribute_affinity, atk_buff_2nd,
            supereffective_buff_2nd, np_buff, supereffective_np, fixed_dmg_2nd, special_def_2nd, 1.099);
    } else {
        dmg_ave_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1);
        dmg_min_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 0.9);
        dmg_max_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1.099);
        dmg_cri_ave_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1);
        dmg_cri_min_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 0.9);
        dmg_cri_max_2nd = calcDmg(atk_2nd, atk_buff_2nd, card_buff_2nd, cri_buff_2nd, bbonus_2nd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_2nd, special_def_2nd, fixed_dmg_2nd, 1.099);
    }

    // 3rd計算
    if (card_3rd == "NP") {
        dmg_ave_3rd = calcNpDmg(atk, np_dmg, np_kind, card_buff_3rd, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 1);
        dmg_min_3rd = calcNpDmg(atk, np_dmg, np_kind, card_buff_3rd, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 0.9);
        dmg_max_3rd = calcNpDmg(atk, np_dmg, np_kind, card_buff_3rd, class_affinity, class_servant, attribute_affinity, atk_buff_3rd,
            supereffective_buff_3rd, np_buff, supereffective_np, fixed_dmg_3rd, special_def_3rd, 1.099);
    } else {
        dmg_ave_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1);
        dmg_min_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 0.9);
        dmg_max_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 1, 0, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1.099);
        dmg_cri_ave_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1);
        dmg_cri_min_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 0.9);
        dmg_cri_max_3rd = calcDmg(atk_3rd, atk_buff_3rd, card_buff_3rd, cri_buff_3rd, bbonus_3rd, bbonus_all, bchain_bonus, 100,
            class_affinity, class_servant, attribute_affinity, 2, 1, supereffective_buff_3rd, special_def_3rd, fixed_dmg_3rd, 1.099);
    }
   
    // 1stダメージ有無・クリティカル有無を設定
    if (card_1st != "NP" && card_1st_cri == "Y") {
        dmg_ave_1st = dmg_cri_ave_1st;
        dmg_min_1st = dmg_cri_min_1st;
        dmg_max_1st = dmg_cri_max_1st;
    } else if (card_1st_cri == "zero") {
        dmg_ave_1st = 0;
        dmg_min_1st = 0;
        dmg_max_1st = 0;
    };

    // 2ndダメージ有無・クリティカル有無を設定
    if (card_2nd != "NP" && card_2nd_cri == "Y") {
        dmg_ave_2nd = dmg_cri_ave_2nd;
        dmg_min_2nd = dmg_cri_min_2nd;
        dmg_max_2nd = dmg_cri_max_2nd;
    } else if (card_2nd_cri == "zero") {
        dmg_ave_2nd = 0;
        dmg_min_2nd = 0;
        dmg_max_2nd = 0;
        };

    // 3rdダメージ有無・クリティカル有無を設定
    if (card_3rd != "NP" && card_3rd_cri == "Y") {
        dmg_ave_3rd = dmg_cri_ave_3rd;
        dmg_min_3rd = dmg_cri_min_3rd;
        dmg_max_3rd = dmg_cri_max_3rd;
    } else if (card_3rd_cri == "zero") {
        dmg_ave_3rd = 0;
        dmg_min_3rd = 0;
        dmg_max_3rd = 0;
    };

    // 計算結果を反映
    $("#dmg_min_1st_" + recNumber).val(Number(rounddown(dmg_min_1st,0)).toLocaleString());
    $("#dmg_ave_1st_" + recNumber).val(Number(rounddown(dmg_ave_1st,0)).toLocaleString());
    $("#dmg_max_1st_" + recNumber).val(Number(rounddown(dmg_max_1st,0)).toLocaleString());
    $("#dmg_min_2nd_" + recNumber).val(Number(rounddown(dmg_min_2nd,0)).toLocaleString());
    $("#dmg_ave_2nd_" + recNumber).val(Number(rounddown(dmg_ave_2nd,0)).toLocaleString());
    $("#dmg_max_2nd_" + recNumber).val(Number(rounddown(dmg_max_2nd,0)).toLocaleString());
    $("#dmg_min_3rd_" + recNumber).val(Number(rounddown(dmg_min_3rd,0)).toLocaleString());
    $("#dmg_ave_3rd_" + recNumber).val(Number(rounddown(dmg_ave_3rd,0)).toLocaleString());
    $("#dmg_max_3rd_" + recNumber).val(Number(rounddown(dmg_max_3rd,0)).toLocaleString());
    $("#dmg_min_total_" + recNumber).val(Number(Math.floor(dmg_min_1st) + Math.floor(dmg_min_2nd) + Math.floor(dmg_min_3rd)).toLocaleString());
    $("#dmg_ave_total_" + recNumber).val(Number(Math.floor(dmg_ave_1st) + Math.floor(dmg_ave_2nd) + Math.floor(dmg_ave_3rd)).toLocaleString());
    $("#dmg_max_total_" + recNumber).val(Number(Math.floor(dmg_max_1st) + Math.floor(dmg_max_2nd) + Math.floor(dmg_max_3rd)).toLocaleString());

}

/**
 * 宝具ダメージ計算
 * @param atk ATK
 * @param np_dmg 宝具威力
 * @param np_kind 宝具種類
 * @param card_buff カードバフ
 * @param class_affinity クラス相性
 * @param class_servant クラス補正
 * @param attribute_affinity 属性相性
 * @param atk_buff 攻撃バフ
 * @param supereffective_buff 特攻威力バフ
 * @param np_buff 宝具バフ
 * @param supereffective_np 特攻宝具倍率
 * @param fixed_dmg 固定ダメージ
 * @param special_def 敵特殊耐性
 * @param random 乱数
 * @return 宝具ダメージ計算結果を返す
 */
function calcNpDmg(atk, np_dmg, np_kind, card_buff, class_affinity, class_servant, attribute_affinity, atk_buff,
    supereffective_buff, np_buff, supereffective_np, fixed_dmg, special_def, random) {

    var dmg;

    dmg = (atk * np_dmg / 100
        * 0.23 * card_list[np_kind] //宝具色補正
        * (100 + card_buff) / 100
        * class_affinity // クラス相性
        * class_servant // クラス補正
        * attribute_affinity // Attri相性
        * random // 乱数
        * (100 + atk_buff) / 100 //攻撃バフ
        * Math.max((100 + supereffective_buff + np_buff), 0.1) / 100
        * Math.max(0, 1.0 - Math.min(5.0, Math.max(0, 1.0 + special_def / 100) - 1.0))
        * supereffective_np / 100);

    dmg = dmg + fixed_dmg;

    return dmg;

}

/**
 * 通常攻撃ダメージ計算
 * @param atk ATK
 * @param atk_buff 攻撃バフ
 * @param card_buff カードバフ
 * @param cri_buff クリティカルバフ
 * @param bbonus カード選択順補正
 * @param bbonus_all 1stB or マイティチェインによる補正
 * @param bchain_bonus Bチェイン補正
 * @param ex_bonus EX補正値
 * @param class_affinity クラス相性
 * @param class_servant クラス補正
 * @param attribute_affinity 属性相性
 * @param cri_flag クリティカル有無
 * @param cri_valid クリティカル有効or向こう
 * @param supereffective_buff 特攻威力バフ
 * @param special_def 敵特殊耐性
 * @param fixed_dmg 固定ダメージ
 * @param random 乱数
 * @return 通常攻撃ダメージ計算結果を返す
 */
function calcDmg(atk, atk_buff, card_buff, cri_buff, bbonus, bbonus_all, bchain_bonus, ex_bonus,
    class_affinity, class_servant, attribute_affinity, cri_flag, cri_valid,
    supereffective_buff, special_def, fixed_dmg, random) {
    
    var dmg;

    dmg = (atk * 0.23 *
        (bbonus / 100 * (100 + card_buff) / 100 + bbonus_all / 100)
        * class_affinity // クラス相性
        * class_servant // クラス補正
        * attribute_affinity // Attri相性
        * random // 乱数
        * (100 + atk_buff) / 100 // 攻撃バフ
        * cri_flag // クリティカルの有無
        * ex_bonus / 100
        * Math.max((100 + supereffective_buff + cri_buff * cri_valid), 0.1) / 100
        * Math.max(0, 1.0 - Math.min(5.0, Math.max(0, 1.0 + special_def / 100) - 1.0)) // 特殊耐性
    );

    dmg = dmg + atk * bchain_bonus / 100 + fixed_dmg;

    return dmg;

}

/**
 * 切り捨て
 * @param num 数値
 * @param digit 桁
 * @return 桁で切り捨てされた数値
 */
function rounddown(num, digit) {
    var digitVal = Math.pow(10, digit);
    return (Math.floor(num * digitVal) / digitVal).toFixed(digit);
}

/**
 * 計算結果を撃破率計算にコピー
 * @param recNumber コピー対象行
 */
function copyProbInput(recNumber) {
    var card_1st, card_2nd, card_3rd, atk, bchain_bonus;
    // Bチェインボーナス分の反映
    card_1st = $("#card_1st_" + recNumber).val();
    card_2nd = $("#card_2nd_" + recNumber).val();
    card_3rd = $("#card_3rd_" + recNumber).val();
    atk = parseFloat($("#atk_" + recNumber).val());
    bchain_bonus = 0;

    if ($("#card_1st_cri_" + recNumber).val() == "zero") {
        $("#dmg_1st").val("0");
        $("#fixed_1st").val("0");
    } else {
        $("#dmg_1st").val(Number($("#dmg_ave_1st_" + recNumber).val().replace(/,/g, "")));
        if (card_1st != "NP") {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_1st").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    if ($("#card_2nd_cri_" + recNumber).val() == "zero") {
        $("#dmg_2nd").val("0");
        $("#fixed_2nd").val("0");
    } else {
        $("#dmg_2nd").val(Number($("#dmg_ave_2nd_" + recNumber).val().replace(/,/g, "")));
        if (card_2nd != "NP") {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_2nd").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    if ($("#card_3rd_cri_" + recNumber).val() == "zero") {
        $("#dmg_3rd").val("0");
        $("#fixed_3rd").val("0");
    } else {
        $("#dmg_3rd").val(Number($("#dmg_ave_3rd_" + recNumber).val().replace(/,/g, "")));
        if (card_3rd != "NP") {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()) + atk * bchain_bonus / 100);
        } else {
            $("#fixed_3rd").val(parseFloat($("#fixed_dmg_" + recNumber).val()));
        }
    };

    $("#dmg_total").val(parseFloat($("#dmg_1st").val()) + parseFloat($("#dmg_2nd").val()) + parseFloat($("#dmg_3rd").val()));
    $("#fixed_total").val(parseFloat($("#fixed_1st").val()) + parseFloat($("#fixed_2nd").val()) + parseFloat($("#fixed_3rd").val()));

}

/**
 * 撃破率計算
 */
function calcProb() {
    var dmg_1st, dmg_2nd, dmg_3rd, buff_1st, buff_2nd, buff_3rd;

    dmg_1st = parseFloat($("#dmg_1st").val());
    dmg_2nd = parseFloat($("#dmg_2nd").val());
    dmg_3rd = parseFloat($("#dmg_3rd").val());
    $("#dmg_total").val(Number(parseFloat($("#dmg_1st").val()) + parseFloat($("#dmg_2nd").val()) + parseFloat($("#dmg_3rd").val())).toLocaleString());
 
    buff_1st = parseFloat($("#fixed_1st").val());
    buff_2nd = parseFloat($("#fixed_2nd").val());
    buff_3rd = parseFloat($("#fixed_3rd").val());
    $("#fixed_total").val(Number(parseFloat($("#fixed_1st").val()) + parseFloat($("#fixed_2nd").val()) + parseFloat($("#fixed_3rd").val())).toLocaleString());

    var rand = new Array(200);
    for (let cnt = 0; cnt < 200; cnt++) {
        rand[cnt] = 0.9 + 0.001 * cnt;
    }

    var first = new Array(40000);
    var second = new Array(40000);
    for (let x = 0; x < 200; x++) {
        for (let y = 0; y < 200; y++) {
            first[200 * x + y] = calc_damage(dmg_1st, buff_1st, 0, 0, 0, 0, 0, 0, rand[x]) + calc_damage(0, 0, dmg_2nd, buff_2nd, 0, 0, 0, 0, rand[y]);
            second[200 * x + y] = calc_damage(0, 0, 0, 0, dmg_3rd, buff_3rd, 0, 0, rand[x]) + calc_damage(0, 0, 0, 0, 0, 0, 0, 0, rand[y]);
        }
    }
    first.sort((a, b) => a - b);
    second.sort((a, b) => a - b);

    var enemy_hp = parseFloat($("#enemy_hp").val());
    var ret = 0;
    for (let x = 0; x < 40000; x++) {
        ret += 40000 - binarySearch(second, enemy_hp - first[x]);
    }
    ret = ret / (40000 * 4);

    $("#prob_result").val(Math.floor(ret) / 100 + "%")

};

/**
 * ダメージ乱数計算
 */
function calc_damage(l1, s1, l2, s2, l3, s3, l4, s4, rand) {
    return Math.floor((l1 - s1) * rand + s1) + Math.floor((l2 - s2) * rand + s2) + Math.floor((l3 - s3) * rand + s3) + Math.floor((l4 - s4) * rand + s4);
};

/**
 * 2分探索
 * @param arr ソート済みの探索対象配列
 * @param target 探索する値
 * @return 探索結果の添字 見つからなかった場合は-1を返す
 */
function binarySearch(arr, target) {

    let min = -1;
    let max = arr.length;

    while (max - min > 1) {

        let mid = Math.floor((min + max) / 2);

        if (arr[mid] < target) {
            min = mid;
        } else {
            max = mid;
        }
    }

    return max;

};

/**
 * パラメーターをNPスター計算にコピー
 * @param recNumber コピー対象行
 */
function copyNpStarInput(recNumber) {

    $("#card_1st_np_star").val($("#card_1st_" + recNumber).val());
    $("#card_2nd_np_star").val($("#card_2nd_" + recNumber).val());
    $("#card_3rd_np_star").val($("#card_3rd_" + recNumber).val());
    if ($("#card_1st_cri_" + recNumber).val() == "zero"){
        $("#card_1st_cri_np_star").val("N");
    }
    else {
        $("#card_1st_cri_np_star").val("Y");
    }
    if ($("#card_2nd_cri_" + recNumber).val() == "zero"){
        $("#card_2nd_cri_np_star").val("N");
    }
    else {
        $("#card_2nd_cri_np_star").val("Y");
    }
    if ($("#card_3rd_cri_" + recNumber).val() == "zero"){
        $("#card_3rd_cri_np_star").val("N");
    }
    else {
        $("#card_3rd_cri_np_star").val("Y");
    }
        
}

/**
 * NPスター獲得量計算メイン処理
 */
function calcRate() {
    var card_1st, card_2nd, card_3rd, nd, q_hit, a_hit, b_hit, np_hit,
        na_buff, nd_buff, hit_1st, hit_2nd, hit_3rd, np_enemy, ok_1st, ok_2nd, ok_3rd, 
        result_1st_np, result_2nd_np, result_3rd_np, result_1st_np_ovk, result_2nd_np_ovk, result_3rd_np_ovk;

    nd = parseFloat($("#ND").val());
    card_1st = $("#card_1st_np_star").val();
    card_2nd = $("#card_2nd_np_star").val();
    card_3rd = $("#card_3rd_np_star").val();
    b_hit = parseFloat($("#b_hit").val());
    a_hit = parseFloat($("#a_hit").val());
    q_hit = parseFloat($("#q_hit").val());
    np_hit = parseFloat($("#np_hit").val());
    na_buff = parseFloat($("#NA_buff").val());
    nd_buff = parseFloat($("#ND_buff").val());
    np_enemy = parseFloat($("#NA_enemy")[0][$("#NA_enemy")[0].selectedIndex].dataset.na);

    if (na_buff > 400) { na_buff = 400 };
    if (nd_buff > 400) { nd_buff = 400 };

    if (card_1st == "NP") { hit_1st = np_hit; ok_1st = np_hit; };
    if (card_1st == "B") { hit_1st = b_hit; ok_1st = b_hit; };
    if (card_1st == "A") { hit_1st = a_hit; ok_1st = a_hit; };
    if (card_1st == "Q") { hit_1st = q_hit; ok_1st = q_hit; };

    if (card_2nd == "NP") { hit_2nd = np_hit; ok_2nd = np_hit; };
    if (card_2nd == "B") { hit_2nd = b_hit; ok_2nd = b_hit; };
    if (card_2nd == "A") { hit_2nd = a_hit; ok_2nd = a_hit; };
    if (card_2nd == "Q") { hit_2nd = q_hit; ok_2nd = q_hit; };

    if (card_3rd == "NP") { hit_3rd = np_hit; ok_3rd = np_hit };
    if (card_3rd == "B") { hit_3rd = b_hit; ok_3rd = b_hit; };
    if (card_3rd == "A") { hit_3rd = a_hit; ok_3rd = a_hit; };
    if (card_3rd == "Q") { hit_3rd = q_hit; ok_3rd = q_hit; };

    if ($("#card_1st_cri_np_star").val() == "N") { hit_1st = 0; ok_1st = 0; };
    if ($("#card_2nd_cri_np_star").val() == "N") { hit_2nd = 0; ok_2nd = 0; };
    if ($("#card_3rd_cri_np_star").val() == "N") { hit_3rd = 0; ok_3rd = 0; };

    result_1st_np = calcNp(hit_1st, nd, np_enemy, na_buff, nd_buff, 0);
    result_2nd_np = calcNp(hit_2nd, nd, np_enemy, na_buff, nd_buff, 0);
    result_3rd_np = calcNp(hit_3rd, nd, np_enemy, na_buff, nd_buff, 0);

    result_1st_np_ovk = calcNp(hit_1st, nd, np_enemy, na_buff, nd_buff, ok_1st);
    result_2nd_np_ovk = calcNp(hit_2nd, nd, np_enemy, na_buff, nd_buff, ok_2nd);
    result_3rd_np_ovk = calcNp(hit_3rd, nd, np_enemy, na_buff, nd_buff, ok_3rd);

    $("#np_result_1st_np").val(result_1st_np + "%");
    $("#np_result_2nd_np").val(result_2nd_np + "%");
    $("#np_result_3rd_np").val(result_3rd_np + "%");
    $("#np_result_total_np").val(BigNumber(result_1st_np).plus(result_2nd_np).plus(result_3rd_np) + "%");

    $("#np_result_1st_np_ovk").val(result_1st_np_ovk + "%");
    $("#np_result_2nd_np_ovk").val(result_2nd_np_ovk + "%");
    $("#np_result_3rd_np_ovk").val(result_3rd_np_ovk + "%");
    $("#np_result_total_np_ovk").val(BigNumber(result_1st_np_ovk).plus(result_2nd_np_ovk).plus(result_3rd_np_ovk) + "%");

};

/**
 * NP獲得量計算
 * @param hit ヒット数
 * @param nd N/D
 * @param enemy_rate 敵補正
 * @param na_buff N/Aバフ
 * @param nd_buff N/Dバフ
 * @param ok オーバーキル
 */
function calcNp(hit, nd, enemy_rate, na_buff, nd_buff, ok) {
    var np;

    np = 100 * (nd * enemy_rate / 100 * (100 + na_buff) / 100 * (100 + nd_buff) / 100);
    np = Math.floor(np);
    np = (np * (hit - ok) + Math.floor(1.5 * np) * ok) / 100;

    return np;
};
