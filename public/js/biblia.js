bib_activa = "textos";
ver_activa = "rv1960";
abr_activa = "Gen";
cap_activa = "1";

//Configurar el websocket
var url = "ws://" + window.location.host + "/ws";
var ws = new WebSocket(url);

//Activa el primer panel para ver los textos biblicos
$( ".btn_b1" ).click(function() {
  bib_activa="textos";
  $( ".btn_b1" ).removeClass( "th2" ).addClass( "th3" );
  $( ".btn_b2" ).removeClass( "th3" ).addClass( "th2" );
  $('.textos2').hide();
  $('.textos').show();
});

//Activa el segundo panel para ver los textos biblicos
$( ".btn_b2" ).click(function() {
  bib_activa="textos2";
  $( ".btn_b2" ).removeClass( "th2" ).addClass( "th3" );
  $( ".btn_b1" ).removeClass( "th3" ).addClass( "th2" );
  $('.textos').hide();
  $('.textos2').show();
});

//Oculta la lista de las versiones de la biblia
$(".btn_version" ).click(function() {
	if ($(".view_version").css('display') === 'none') {
   		$('.view_version').show();
	}else {
		$('.view_version').hide();
	}
});

//Oculta la lista de los libros
$(".btn_libros" ).click(function() {
	if ($(".view_libros").css('display') === 'none') {
   		$('.view_libros').show();
	}else {
		$('.view_libros').hide();
	}
});


//Cambiar cbx con la opcion de la version clickeado (cbx_biblia)
$(".op_version" ).click(function() {
   myspan = '<span class="cbx_span far fa-arrow-alt-circle-down"></span>';
   $(".btn_version" ).text($(this).text()).append(myspan);
   $('.view_version').hide();
});

//Cambiar cbx con la opcion del libro clickeado (cbx_libro)
function TraerLibros(indice){
  myspan = '<span class="cbx_span far fa-arrow-alt-circle-down"></span>';
  abr_activa = $('.oc'+indice).text();
  libro = $('.op'+indice).text();
  libro = libro.slice(0, libro.length - abr_activa.length);
  $(".btn_libros" ).text(libro).append(myspan);
  $('.view_libros').hide();
}


//Funcion Ajax para traer lo libros de la biblia y rellenarlo en un Combobox
const rellenarLibros = async () => {
  const response = await fetch('http://'+ window.location.host +'/libros');
  const js = await response.json();
  for (index = 0; index < js.length; index++) {
    cad = '<button class="opcion op_libros th2 op'+index+'" onclick="TraerLibros('+index+')">'+js[index].Name;
    cad = cad + '<span class="oc_span oc'+index+'">'+js[index].Abbr+'</span></button>';
    $(".lst_libros").append(cad);
    }
}
rellenarLibros();

//Obtiene la version activa para la busqueda
$(".op_version" ).click(function() {
  switch ($(this).text()) {
      case "Reina Valera 1960":
          ver_activa = "rv1960";
          break;
      case "Reina Valera Contemporanea":
          ver_activa = "rvc";
          break;
      case "Biblia al Día":
          ver_activa = "bad";
          break;
      case "Biblia Lenguaje Sencillo":
          ver_activa = "bls";
          break;
      case "Nueva Traducción Viviente":
          ver_activa = "btv";
          break;
  }
});


//Funcion Ajax para traer los versiculo pedidos en la busqueda
$(".buscar" ).click(function() { traerVersos(); });
const traerVersos = async () => {
  abre = abr_activa;
  capitulo = $('.cap').val();
  const traer = await fetch("http://"+ window.location.host+"/versos/"+ver_activa+"/"+abre+"/"+capitulo);
  const json = await traer.json();
  $("."+bib_activa ).empty();
  cap_final = json.length;
  for (index = 0; index < json.length; index++) {
    cad = '<button class="tx th2" onclick="Pulsado('+index+')">';
    cad = cad + "<span class='leyenda "+bib_activa+"abr"+index+"'>"+json[index].Abrev+" </span>";
		cad = cad + "<span class='leyenda "+bib_activa+"cap"+index+"'>"+json[index].Chapter+":"+json[index].Verse+"</span>";
		cad = cad + "<span class='t_texto "+bib_activa+"tex"+index+"'>"+json[index].Text+"</span>";
		cad = cad + "</button>";
    $("."+bib_activa).append(cad);
  }
}

//Envia el texto al Websockets
function Pulsado(ind) {
  abr = $('.'+bib_activa+'abr'+ind).text();
  cap = $('.'+bib_activa+'cap'+ind).text();
  ver = cap.split(":");
  $('.ver').val(ver[1]);
  tex = $('.'+bib_activa+'tex'+ind).text();
  tex = tex.replace('\n', '');
  ws.send("A#B#"+abr+"#"+cap+"#"+tex);
}

//Funcion Ajax para traer los textos de la busqueda (LIKE)
$(".btn_buscar" ).click(function() { buscarTexto(); });
const buscarTexto = async () => {
  texto = $(".txt_busq").val();
  const traer = await fetch("http://"+ window.location.host+"/busqueda/"+ver_activa+"/"+texto);
  const json = await traer.json();
  $("."+bib_activa ).empty();
  cap_final = json.length;
  for (index = 0; index < json.length; index++) {
    cad = '<button class="tx th2" onclick="Pulsado('+index+')">';
    cad = cad + "<span class='leyenda "+bib_activa+"abr"+index+"'>"+json[index].Abrev+" </span>";
		cad = cad + "<span class='leyenda "+bib_activa+"cap"+index+"'>"+json[index].Chapter+":"+json[index].Verse+"</span>";
		cad = cad + "<span class='t_texto "+bib_activa+"tex"+index+"'>"+json[index].Text+"</span>";
		cad = cad + "</button>";
    $("."+bib_activa).append(cad);
  }
}

$(".btn_sig" ).click(function() {
  capitulo = parseInt($('.ver').val()) ;
  if (capitulo != cap_final ) {
    $('.ver').val(capitulo+1);
  }
});

$(".btn_ant" ).click(function() {
  capitulo = parseInt($('.ver').val()) ;
  if (capitulo != 1) {
    capitulo = parseInt($('.ver').val()) ;
    $('.ver').val(capitulo-1);
  }
});
//Pausa el video por defecto
$(".btn_quitar" ).click(function() { ws.send("A#Q"); });

//Poner la Imagen por defecto
$(".btn_imagen" ).click(function() { ws.send("I#V"); });

//Visualizar el video por defecto
$(".btn_video" ).click(function() { ws.send("V#V"); });

//Reproduce el video por defecto
$(".btn_play" ).click(function() { ws.send("V#R"); });

//Pausa el video por defecto
$(".btn_pause" ).click(function() { ws.send("V#P"); });