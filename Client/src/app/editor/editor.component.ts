import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import sdk from '@stackblitz/sdk';

@Component({
  selector: 'app-editor',
  imports: [],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css',
})
export class EditorComponent implements OnInit {
  userId = 'user12345'; // Replace with actual user ID
  projectName = 'my-stackblitz-project';
  stackblitzUrl: SafeResourceUrl;
  stackblitzData: any = {};

  constructor(private http: HttpClient, private sanitizer: DomSanitizer) {
    this.stackblitzUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://stackblitz.com/edit/stackblitz-starters-pa68qm8s?embed=1&file=package.json'
    );
  }

  ngOnInit() {
    this.loadProject();
  }

  // Load project from backend
  // loadProject() {
  //   this.http
  //     .get<any>(
  //       `http://localhost:3000/get-project/${this.userId}/${this.projectName}`
  //     )
  //     .subscribe(
  //       (response) => {
  //         if (response.success && response.stackblitzData?.files) {
  //           this.stackblitzData = response.stackblitzData;
  //           sdk.openProject(this.stackblitzData); // Open saved project
  //         } else {
  //           this.createNewProject(); // If no saved project, fork from URL
  //         }
  //       },
  //       (error) => {
  //         console.error('Error loading project:', error);
  //         this.createNewProject(); // Fallback if project not found
  //       }
  //     );
  // }

  loadProject() {
    this.http
      .get<any>(
        `http://localhost:3000/get-project/${this.userId}/${this.projectName}`
      )
      .subscribe(
        (response) => {
          if (response.success && response.stackblitzData?.files) {
            this.stackblitzData = response.stackblitzData;

            console.log('Loading saved project:', this.stackblitzData.files); // Debugging

            sdk.embedProject('editor-container', this.stackblitzData, {
              forceEmbedLayout: true,
              openFile: 'src/main.ts', // Open a specific file for clarity
            });
          } else {
            console.warn('No saved project found, creating a new one.');
            this.createNewProject();
          }
        },
        (error) => {
          console.error('Error loading project:', error);
          this.createNewProject();
        }
      );
  }

  // Create a new StackBlitz project
  createNewProject() {
    sdk
      .embedProjectId('editor-container', 'stackblitz-starters-pa68qm8s', {
        forceEmbedLayout: true,
        openFile: 'package.json',
      })
      .then((editor) => {
        editor.getFsSnapshot().then((files) => {
          // Extract template dynamically based on project files or StackBlitz settings
          const detectedTemplate = this.detectProjectTemplate(files);

          this.stackblitzData = {
            files,
            title: 'Forked StackBlitz Project',
            description: 'Dynamically forked from StackBlitz',
            template: detectedTemplate, // Set the correct template dynamically
          };
        });
      })
      .catch((error) => console.error('Error embedding project:', error));
  }

  // Save project to backend
  // saveProject() {
  //   sdk
  //     .embedProjectId('editor-container', 'stackblitz-starters-pa68qm8s')
  //     .then((editor) => {
  //       return editor.getFsSnapshot(); // Fetch updated files
  //     })
  //     .then((files) => {
  //       this.stackblitzData.files = files; // Store updated files

  //       console.log('Saving updated files:', this.stackblitzData.files); // Debugging

  //       this.http
  //         .post('http://localhost:3000/save-project', {
  //           userId: this.userId,
  //           projectName: this.projectName,
  //           stackblitzData: this.stackblitzData,
  //         })
  //         .subscribe(
  //           (response) => {
  //             console.log('Project saved successfully:', response);
  //           },
  //           (error) => {
  //             console.error('Error saving project:', error);
  //           }
  //         );
  //     })
  //     .catch((error) =>
  //       console.error('Error retrieving StackBlitz files:', error)
  //     );
  // }
  saveProject() {
    sdk
      .connect(document.getElementById('editor-container') as HTMLIFrameElement)
      .then((editor) => {
        return editor.getFsSnapshot(); // Get latest files from the editor
      })
      .then((files) => {
        this.stackblitzData = {
          files,
          title: 'Updated StackBlitz Project',
          description: 'Project with latest changes',
          template: 'angular-cli', // Ensure correct template
        };

        console.log('Saving updated files:', this.stackblitzData.files); // Debugging

        this.http
          .post('http://localhost:3000/save-project', {
            userId: this.userId,
            projectName: this.projectName,
            stackblitzData: this.stackblitzData,
          })
          .subscribe(
            (response) => {
              console.log('Project saved successfully:', response);
            },
            (error) => {
              console.error('Error saving project:', error);
            }
          );
      })
      .catch((error) =>
        console.error('Error retrieving StackBlitz files:', error)
      );
  }

  // Function to detect StackBlitz template
  detectProjectTemplate(files: any): string {
    if (files['angular.json']) return 'angular-cli';
    if (files['package.json'] && files['package.json'].includes('"react"'))
      return 'create-react-app';
    if (files['index.html'] && files['script.js']) return 'html';
    if (files['index.js']) return 'javascript';
    if (files['server.js'] || files['index.ts']) return 'node';
    if (files['tsconfig.json']) return 'typescript';
    if (files['polymer.json']) return 'polymer';
    if (files['vue.config.js']) return 'vue';
    return 'javascript'; // Default fallback
  }
}

