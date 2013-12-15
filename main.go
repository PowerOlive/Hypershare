package main

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"html/template"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

var templates = template.Must(template.ParseFiles("tmpl/upload.html"))

type File struct {
	*multipart.Part
}

type FileResult struct {
	Name string
	Hash string
}

func display(w http.ResponseWriter, tmpl string, data interface{}) {
	templates.ExecuteTemplate(w, tmpl+".html", data)
}

func uploadHandler(w http.ResponseWriter, r *http.Request) {
	switch r.Method {

	case "GET":
		display(w, "upload", nil)

	case "POST":
		reader, err := r.MultipartReader()

		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		var files []FileResult

		for {
			part, err := reader.NextPart()
			if err == io.EOF {
				break
			}

			if part.FileName() == "" {
				continue
			}

			file := &File{part}
			dst, err := os.Create("assets/uploads/" + file.HashName())

			defer dst.Close()

			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if _, err := io.Copy(dst, part); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			fileResult := FileResult{
				Name: file.FileName(),
				Hash: file.HashName(),
			}

			files = append(files, fileResult)
		}

		if jsonRes, err := json.Marshal(files); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		} else {
			fmt.Fprintf(w, string(jsonRes))
		}
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (p *File) HashName() string {
	hasher := sha256.New()
	hasher.Write([]byte(p.FileName()))

	return hex.EncodeToString(hasher.Sum(nil))
}

func main() {
	http.HandleFunc("/", uploadHandler)

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))))

	http.ListenAndServe(":80", nil)
}
