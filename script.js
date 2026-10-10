// 0 là ô trống, -1 là block, số dương là loại hình
var hang = 12;
var cot = 12;
// ảnh pokemon lấy từ source gốc
var hinh = [''];
for (var i = 1; i <= 36; i++) {
    hinh.push('images/pieces' + i + '.png');
}
var luat = [
    '',
    'Màn 1: Nối các cặp hình giống nhau để dọn hết bàn.',
    'Màn 2: Có 4 block đứng yên. Đường nối không đi xuyên qua block.',
    'Màn 3: Bạn có 5 lượt chọn sai. Sai hình hoặc đường nối đều mất 1 lượt.',
    'Màn 4: Chỉ nối loại hình đang được yêu cầu. Hết loại đó mới chuyển sang loại tiếp theo.',
    'Màn 5: Sau mỗi cặp đúng, các block thử di chuyển sang ô trống cạnh nó.',
    'Màn 6: Cứ 8 giây thêm 1 block vào ô trống. Nếu block chặn hết nước đi thì thua.'
];
var ban = [];
var man = 1;
var diem = 0;
var giay = 600;
var sai = 5;
var mucTieu = 0;
var soGoiY = 3;
var soXao = 3;
var oChon = null;
var dangChoi = false;
var tamDung = false;
var dangNoi = false;
var daThang = false;
var dongHo = null;
var henNoi = null;
var henGoiY = null;
var mocGio = 0;
var mocBlock = 8;

function lay(id) {
    return document.getElementById(id);
}

function tron(mang) {
    for (var i = mang.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tam = mang[i];
        mang[i] = mang[j];
        mang[j] = tam;
    }
}

function cacO() {
    var ds = [];
    for (var r = 1; r <= hang; r++) {
        for (var c = 1; c <= cot; c++) {
            if (ban[r][c] > 0) ds.push({r: r, c: c});
        }
    }
    return ds;
}

function taoBan() {
    ban = [];
    // thêm một vòng ô trống để đường nối đi vòng ngoài bàn
    for (var r = 0; r < hang + 2; r++) {
        ban.push(new Array(cot + 2).fill(0));
    }
    if (man == 2 || man == 5) {
        ban[4][4] = -1;
        ban[4][9] = -1;
        ban[9][4] = -1;
        ban[9][9] = -1;
    }
    var dsHinh = [];
    var soO = hang * cot;
    if (man == 2 || man == 5) soO -= 4;
    for (var i = 0; i < soO / 2; i++) {
        var loai = i % 24 + 1;
        dsHinh.push(loai, loai);
    }
    tron(dsHinh);
    for (var r = 1; r <= hang; r++) {
        for (var c = 1; c <= cot; c++) {
            if (ban[r][c] == 0) ban[r][c] = dsHinh.pop();
        }
    }
    doiMucTieu();
    if (!timCap()) xaoBan();
}

function veBan() {
    var html = '';
    for (var r = 0; r < hang + 2; r++) {
        for (var c = 0; c < cot + 2; c++) {
            var giaTri = ban[r][c];
            if (giaTri == 0) {
                html += '<span class="o trong"></span>';
            } else if (giaTri == -1) {
                html += '<button class="o block" disabled aria-label="Chướng ngại vật">■</button>';
            } else {
                var ten = 'o';
                if (oChon && oChon.r == r && oChon.c == c) ten += ' chon';
                html += '<button class="' + ten + '" id="o-' + r + '-' + c + '" data-hang="' + r + '" data-cot="' + c + '" aria-label="Pokemon ' + giaTri + ', hàng ' + r + ', cột ' + c + '"' + ((!dangChoi || tamDung || dangNoi) ? ' disabled' : '') + '><img src="' + hinh[giaTri] + '" alt="Pokemon ' + giaTri + '" draggable="false"></button>';
            }
        }
    }
    lay('banchoi').innerHTML = html;
}

function capNhat() {
    lay('diem').textContent = diem;
    lay('thoigian').textContent = Math.ceil(giay);
    lay('socap').textContent = cacO().length / 2;
    lay('luatchoi').textContent = luat[man];
    lay('nutgoiy').textContent = 'Gợi ý (' + soGoiY + ')';
    lay('xaotron').textContent = 'Xáo trộn (' + soXao + ')';
    lay('phu').textContent = '';
    if (man == 3) lay('phu').textContent = 'Lượt sai còn lại: ' + sai;
    if (man == 4) {
        if (mucTieu > 0) lay('phu').innerHTML = 'Cần nối: <img class="muctieu" src="' + hinh[mucTieu] + '" alt="Pokemon ' + mucTieu + '">';
        else lay('phu').textContent = 'Đã nối hết hình';
    }
    if (man == 6) lay('phu').textContent = 'Thêm block sau: ' + Math.ceil(mocBlock) + ' giây';
    lay('nutgoiy').disabled = !dangChoi || tamDung || dangNoi || soGoiY == 0;
    lay('xaotron').disabled = !dangChoi || tamDung || dangNoi || soXao == 0;
    lay('tamdung').disabled = !dangChoi || dangNoi;
    lay('tamdung').textContent = tamDung ? 'Tiếp tục' : 'Tạm dừng';
    lay('mantiep').disabled = !daThang || man == 6;
}

// tìm đường bằng cách thử đi lên, phải, xuống, trái
// mỗi trạng thái nhớ cả hướng đi và số lần rẽ
function timDuong(a, b) {
    if (a.r == b.r && a.c == b.c) return null;
    var huong = [[-1, 0], [0, 1], [1, 0], [0, -1]];
    var daDi = {};
    var ds = [{r: a.r, c: a.c, huong: -1, re: 0, truoc: null}];
    for (var i = 0; i < ds.length; i++) {
        var o = ds[i];
        for (var k = 0; k < 4; k++) {
            var r = o.r + huong[k][0];
            var c = o.c + huong[k][1];
            var re = o.re;
            if (o.huong != -1 && o.huong != k) re++;
            if (r < 0 || r > hang + 1 || c < 0 || c > cot + 1 || re > 2) continue;
            var denDich = r == b.r && c == b.c;
            if (ban[r][c] != 0 && !denDich) continue;
            var ma = r + ',' + c + ',' + k;
            if (daDi[ma] !== undefined && daDi[ma] <= re) continue;
            daDi[ma] = re;
            var moi = {r: r, c: c, huong: k, re: re, truoc: o};
            if (denDich) {
                var duong = [];
                while (moi) {
                    duong.unshift({r: moi.r, c: moi.c});
                    moi = moi.truoc;
                }
                return duong;
            }
            ds.push(moi);
        }
    }
    return null;
}

function timCap() {
    var ds = cacO();
    for (var i = 0; i < ds.length; i++) {
        var a = ds[i];
        if (man == 4 && ban[a.r][a.c] != mucTieu) continue;
        for (var j = i + 1; j < ds.length; j++) {
            var b = ds[j];
            if (ban[a.r][a.c] == ban[b.r][b.c]) {
                var duong = timDuong(a, b);
                if (duong) return {a: a, b: b, duong: duong};
            }
        }
    }
    return null;
}

// xáo hình, giữ nguyên vị trí block và số lượng mỗi loại
function xaoBan() {
    var ds = cacO();
    if (ds.length == 0) return true;
    var giaTri = [];
    for (var i = 0; i < ds.length; i++) giaTri.push(ban[ds[i].r][ds[i].c]);
    for (var lan = 0; lan < 30; lan++) {
        tron(giaTri);
        for (var i = 0; i < ds.length; i++) ban[ds[i].r][ds[i].c] = giaTri[i];
        if (timCap()) return true;
    }
    // nếu ngẫu nhiên vẫn bí, đặt một cặp vào hai vị trí nối được
    for (var i = 0; i < ds.length; i++) {
        for (var j = i + 1; j < ds.length; j++) {
            var a = ds[i], b = ds[j];
            if (!timDuong(a, b)) continue;
            var loai = man == 4 ? mucTieu : ban[a.r][a.c];
            var dich = [a, b];
            for (var k = 0; k < 2; k++) {
                var p = dich[k];
                if (ban[p.r][p.c] == loai) continue;
                for (var n = 0; n < ds.length; n++) {
                    var q = ds[n];
                    if (k == 1 && q.r == a.r && q.c == a.c) continue;
                    if (ban[q.r][q.c] == loai) {
                        ban[q.r][q.c] = ban[p.r][p.c];
                        ban[p.r][p.c] = loai;
                        break;
                    }
                }
            }
            return true;
        }
    }
    return false;
}

function doiMucTieu() {
    mucTieu = 0;
    if (man != 4) return;
    var ds = cacO();
    for (var i = 0; i < ds.length; i++) {
        var loai = ban[ds[i].r][ds[i].c];
        if (mucTieu == 0 || loai < mucTieu) mucTieu = loai;
    }
}

function veDuong(ds) {
    var diemNoi = '';
    for (var i = 0; i < ds.length; i++) diemNoi += (ds[i].c + 0.5) + ',' + (ds[i].r + 0.5) + ' ';
    lay('duongnoi').innerHTML = '<polyline points="' + diemNoi + '" fill="none" stroke="red" stroke-width="0.07" />';
}

function chonO(r, c) {
    if (!dangChoi || tamDung || dangNoi || ban[r][c] <= 0) return;
    chayGio();
    if (!dangChoi) return;
    xoaGoiY();
    if (!oChon) {
        oChon = {r: r, c: c};
        veBan();
        return;
    }
    if (oChon.r == r && oChon.c == c) {
        oChon = null;
        veBan();
        return;
    }
    var a = oChon;
    var b = {r: r, c: c};
    var dungHinh = ban[a.r][a.c] == ban[r][c];
    var dungLoai = man != 4 || ban[r][c] == mucTieu;
    var duong = dungHinh && dungLoai ? timDuong(a, b) : null;
    oChon = null;
    if (!duong) {
        lay('thongbao').textContent = dungLoai ? 'Không nối được hai ô này.' : 'Hãy nối loại đang được yêu cầu.';
        if (man == 3) {
            sai--;
            if (sai == 0) ketThuc(false, 'Bạn đã chọn sai 5 lần.');
        }
        veBan();
        capNhat();
        return;
    }
    dangNoi = true;
    veBan();
    veDuong(duong);
    capNhat();
    henNoi = setTimeout(function () {
        henNoi = null;
        if (!dangChoi) return;
        chayGio();
        if (!dangChoi) return;
        ban[a.r][a.c] = 0;
        ban[b.r][b.c] = 0;
        diem += 10;
        dangNoi = false;
        lay('duongnoi').innerHTML = '';
        doiMucTieu();
        if (cacO().length == 0) {
            ketThuc(true, man == 6 ? 'Bạn đã thắng màn 6!' : 'Bạn đã thắng màn ' + man + '.');
            return;
        }
        if (man == 5) diChuyenBlock();
        lay('thongbao').textContent = '+10 điểm';
        if (!timCap()) {
            if (xaoBan()) lay('thongbao').textContent = 'Hết nước đi, đã tự xáo lại miễn phí.';
            else { ketThuc(false, 'Bàn đã bị chặn, không còn nước đi.'); return; }
        }
        veBan();
        capNhat();
    }, 250);
}

function diChuyenBlock() {
    var ds = [];
    for (var r = 1; r <= hang; r++) {
        for (var c = 1; c <= cot; c++) {
            if (ban[r][c] == -1) ds.push({r: r, c: c});
        }
    }
    for (var i = 0; i < ds.length; i++) {
        var a = ds[i];
        var huong = [[-1, 0], [1, 0], [0, -1], [0, 1]];
        tron(huong);
        for (var k = 0; k < 4; k++) {
            var r = a.r + huong[k][0], c = a.c + huong[k][1];
            if (r < 1 || r > hang || c < 1 || c > cot || ban[r][c] != 0) continue;
            ban[a.r][a.c] = 0;
            ban[r][c] = -1;
            // không cho block di chuyển làm người chơi thua ngay vì hết nước đi
            if (timCap()) break;
            ban[r][c] = 0;
            ban[a.r][a.c] = -1;
        }
    }
}

function themBlock() {
    var trong = [];
    for (var r = 1; r <= hang; r++) {
        for (var c = 1; c <= cot; c++) {
            if (ban[r][c] == 0) trong.push({r: r, c: c});
        }
    }
    if (trong.length == 0) return;
    var o = trong[Math.floor(Math.random() * trong.length)];
    ban[o.r][o.c] = -1;
    oChon = null;
    xoaGoiY();
    lay('thongbao').textContent = 'Một block mới vừa xuất hiện!';
    if (!timCap()) ketThuc(false, 'Block đã chặn hết các cặp có thể nối.');
    else veBan();
}

function xoaGoiY() {
    clearTimeout(henGoiY);
    var ds = document.querySelectorAll('.goiy');
    for (var i = 0; i < ds.length; i++) ds[i].classList.remove('goiy');
}

function goiY() {
    if (!dangChoi || tamDung || dangNoi || soGoiY == 0) return;
    chayGio();
    if (!dangChoi) return;
    var cap = timCap();
    if (!cap) return;
    xoaGoiY();
    oChon = null;
    soGoiY--;
    veBan();
    lay('o-' + cap.a.r + '-' + cap.a.c).classList.add('goiy');
    lay('o-' + cap.b.r + '-' + cap.b.c).classList.add('goiy');
    henGoiY = setTimeout(xoaGoiY, 2000);
    capNhat();
}

function chayGio() {
    if (!dangChoi || tamDung) return;
    var bayGio = Date.now();
    var daQua = (bayGio - mocGio) / 1000;
    mocGio = bayGio;
    giay = Math.max(0, giay - daQua);
    if (giay == 0) { ketThuc(false, 'Đã hết thời gian.'); return; }
    if (man == 6) {
        mocBlock -= daQua;
        // chờ vẽ xong đường nối rồi mới thêm block
        while (mocBlock <= 0 && !dangNoi && dangChoi) {
            mocBlock += 8;
            themBlock();
        }
    }
    capNhat();
}

function ketThuc(thang, thongBao) {
    dangChoi = false;
    daThang = thang;
    dangNoi = false;
    oChon = null;
    clearInterval(dongHo);
    clearTimeout(henNoi);
    xoaGoiY();
    lay('duongnoi').innerHTML = '';
    lay('thongbao').textContent = thongBao + ' Điểm: ' + diem;
    veBan();
    capNhat();
}

function batDau() {
    clearInterval(dongHo);
    clearTimeout(henNoi);
    xoaGoiY();
    man = Number(lay('chonman').value);
    diem = 0;
    giay = 600;
    sai = 5;
    soGoiY = 3;
    soXao = 3;
    oChon = null;
    dangChoi = true;
    tamDung = false;
    dangNoi = false;
    daThang = false;
    mocBlock = 8;
    taoBan();
    lay('duongnoi').innerHTML = '';
    lay('manche').hidden = true;
    lay('thongbao').textContent = 'Bắt đầu màn ' + man;
    veBan();
    capNhat();
    mocGio = Date.now();
    dongHo = setInterval(chayGio, 200);
}

lay('banchoi').addEventListener('click', function (e) {
    var nut = e.target;
    if (nut.dataset.hang !== undefined) chonO(Number(nut.dataset.hang), Number(nut.dataset.cot));
});
lay('batdau').onclick = batDau;
lay('chonman').onchange = batDau;
lay('nutgoiy').onclick = goiY;
lay('xaotron').onclick = function () {
    if (!dangChoi || tamDung || dangNoi || soXao == 0) return;
    chayGio();
    if (!dangChoi) return;
    soXao--;
    oChon = null;
    xoaGoiY();
    if (!xaoBan()) { ketThuc(false, 'Không còn đường nối vì block đã chặn.'); return; }
    lay('thongbao').textContent = 'Đã xáo trộn hình.';
    veBan();
    capNhat();
};
lay('tamdung').onclick = function () {
    if (!dangChoi || dangNoi) return;
    if (!tamDung) {
        chayGio();
        if (!dangChoi) return;
    }
    tamDung = !tamDung;
    mocGio = Date.now();
    oChon = null;
    xoaGoiY();
    lay('manche').hidden = !tamDung;
    lay('manche').textContent = 'Đang tạm dừng';
    veBan();
    capNhat();
};
lay('mantiep').onclick = function () {
    if (!daThang || man == 6) return;
    lay('chonman').value = man + 1;
    batDau();
};
// hiện bàn mẫu trước khi bắt đầu, đồng hồ chưa chạy
taoBan();
veBan();
capNhat();
