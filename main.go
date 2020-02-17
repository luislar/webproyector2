package main

import (
	"database/sql"
	"fmt"
	"os"
	"io/ioutil"
	"encoding/json"
	"net/http"
	"github.com/gin-gonic/gin"
	_ "github.com/mattn/go-sqlite3"
	melody "gopkg.in/olahol/melody.v1"
	"strconv"
)

// Estructura y Funcion para enviar los libros de la biblia y enviarlo por API/JSON
type Row struct {
	Id           byte
	Testament_id byte
	Name         string
	Abbr         string
}

// Estructura y Funcion para  enviar los versículos pasado por parametros y enviarlo por API/JSON
type Verso struct {
	Abrev   string
	Chapter byte
	Verse   byte
	Text    string
}

type Config struct {
		Port int
		A float32
		B float32
	}

//Traer el template "biblia.html" y llenarlo con los datos enviados
func bibliaPage(c *gin.Context) {
	c.HTML(http.StatusOK, "biblia.html", gin.H{
		"title":  "Biblia",
	})
}




func main() {

	jsonFile, _ := os.Open("config.json")
	defer jsonFile.Close()
	byteValue, _ := ioutil.ReadAll(jsonFile)
  var obj Config
	json.Unmarshal(byteValue, &obj)
	fmt.Printf("Puerto : %d", obj.Port);

	r := gin.Default() //Motor del Framework Gin
	m := melody.New()  //Motor del WebSocket

	//Rellena los template y Pone en public las carpetas
	r.LoadHTMLGlob("templates/*.html")
	r.Static("/public", "./public")

	//Enrutadores de la aplicacion
	r.GET("/biblia", bibliaPage)
	r.GET("/libros", traerlibros)


	r.GET("/versos/:biblia/:abrev/:capitulo", traerversos)
	r.GET("/busqueda/:biblia/:texto", buscartexto)

	//Funcion para servir los templates, estos estan fuera de public
	r.GET("/", func(c *gin.Context) {
		http.ServeFile(c.Writer, c.Request, "./templates/*")
	})

	//Funcion para iniciar los WebSocket
	r.GET("/ws", func(c *gin.Context) {
		m.HandleRequest(c.Writer, c.Request)
	})

	//Recibe los mensajes del websocket y lo envia por el canal del servidor
	m.HandleMessage(func(s *melody.Session, msg []byte) {
		m.Broadcast(msg)
	})

	//Inicia el Servidor en el puerto detallado
	r.Run(":"+strconv.Itoa(obj.Port))
}

//Variables
var Imagenes, Videos, Fuentes []string
var archivo string
var valor int

//Envia por API los nombre de todos los libro de la biblia
func traerlibros(c *gin.Context) {
	db, _ := sql.Open("sqlite3", "./biblias/rv1960.sqlite")
	defer db.Close()
	rows, _ := db.Query("select * from book ")
	defer rows.Close()
	var libros []Row
	for rows.Next() {
		var r Row
		rows.Scan(&r.Id, &r.Testament_id, &r.Name, &r.Abbr)
		libros = append(libros, r)
	}
	c.JSON(http.StatusOK, libros)
}

//Envia por API los textos biblicos filtrado por Version de biblia, Libro y Capítulo
func traerversos(c *gin.Context) {
	biblia := c.Param("biblia")
	abre := c.Param("abrev")
	capitulo := c.Param("capitulo")
	dbv, _ := sql.Open("sqlite3", "./biblias/"+biblia+".sqlite")
	defer dbv.Close()
	rowsv, _ := dbv.Query("SELECT book.abbreviation, verse.chapter, verse.verse, verse.text FROM Book, verse WHERE verse.book_id = book.id AND book.abbreviation ='" + abre + "' AND verse.chapter = " + capitulo)
	defer rowsv.Close()
	var verso []Verso
	for rowsv.Next() {
		var rvx Verso
		rowsv.Scan(&rvx.Abrev, &rvx.Chapter, &rvx.Verse, &rvx.Text)
		verso = append(verso, rvx)
	}
	c.JSON(http.StatusOK, verso)
	fmt.Println(biblia)
}

//Envia por API los resultado de un texto en la biblia
func buscartexto(c *gin.Context) {
	biblia := c.Param("biblia")
	texto := c.Param("texto")
	dbv, _ := sql.Open("sqlite3", "./biblias/"+biblia+".sqlite")
	defer dbv.Close()
	rowsv, _ := dbv.Query("SELECT book.abbreviation, verse.chapter, verse.verse, verse.text FROM Book, verse WHERE verse.book_id = book.id AND verse.text LIKE '%" + texto + "%' LIMIT 250")
	defer rowsv.Close()
	var verso []Verso
	for rowsv.Next() {
		var rv Verso
		rowsv.Scan(&rv.Abrev, &rv.Chapter, &rv.Verse, &rv.Text)
		verso = append(verso, rv)
	}
	c.JSON(http.StatusOK, verso)
}
