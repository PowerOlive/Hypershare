package main

import (
	"crypto/sha256"
	"encoding/hex"
	"html/template"
	"io"
	"mime/multipart"
	"net/http"
	"os"
)

var templates = template.Must(template.ParseFiles("tmpl/upload.html"))

type MyPart struct {
	*multipart.Part
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

		for {
			part, err := reader.NextPart()
			if err == io.EOF {
				break
			}

			if part.FileName() == "" {
				continue
			}

			myPart := &MyPart{part}
			dst, err := os.Create("assets/uploads/" + myPart.HashName())

			defer dst.Close()

			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			if _, err := io.Copy(dst, part); err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
		}

		display(w, "upload", "Upload successful.")
	default:
		w.WriteHeader(http.StatusMethodNotAllowed)
	}
}

func (p *MyPart) HashName() string {
	hasher := sha256.New()
	hasher.Write([]byte(p.FormName() + p.FileName()))

	return hex.EncodeToString(hasher.Sum(nil))
}

func main() {
	http.HandleFunc("/", uploadHandler)

	http.Handle("/assets/", http.StripPrefix("/assets/", http.FileServer(http.Dir("assets"))))

	http.ListenAndServe(":80", nil)
}
