if(window.location.href.startsWith('https://secure.weda.fr/FolderMedical/AntecedentForm.aspx')){

  lightObserver('#ContentPlaceHolder1_ArbreCim10UCForm1_TreeViewCim10n4Nodes', function(element) {
    let tablesATCD = element[0].querySelectorAll("table");
    for (const table of tablesATCD)
    {
      let hide = table.querySelector("span[style='color:#a0a0a0']").innerHTML.includes("."); //On récupère les CIM10 contenant un . qui sont des sous catégories
      if (hide)
        table.remove();
    }
  });

}