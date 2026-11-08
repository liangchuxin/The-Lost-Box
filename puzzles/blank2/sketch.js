function setup(){
    if (typeof parent.addItem === "function") parent.addItem(1);
    let str = localStorage.getItem('collected_items')
    if(str == null){
        str = "[]";
    }
    let collected_items = JSON.parse(str);
    collected_items.push(1);
    localStorage.setItem('collected_items', JSON.stringify(collected_items));
}