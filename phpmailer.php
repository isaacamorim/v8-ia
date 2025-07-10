<?php
	use PHPMailer\PHPMailer\PHPMailer;
	use PHPMailer\PHPMailer\Exception;
	require 'phpmailer/src/Exception.php';
	require 'phpmailer/src/PHPMailer.php';
	require 'phpmailer/src/SMTP.php';
	
	/* UPLOAD FILE VALIDATION
	$name_of_uploaded_file = basename($_FILES['file']['name']);
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	//Get the uploaded file information
	$filetype = finfo_file($finfo, $_FILES['file']) . "\n";
	echo $filetype;
	//get the file extension of the file
	//$allowed_extensions = array("pdf", "doc", "docx", "odt");
	if ($filetype != "application/pdf" && $filetype != "application/msword" && $filetype != "application/vnd.oasis.opendocument.text"){
		die("Supported only: PDF, DOC and ODT.");
	}
	//$type_of_uploaded_file = substr($name_of_uploaded_file, strrpos($name_of_uploaded_file, '.') + 1);
	// Check file size
	if($_FILES["file"]["size"] > 5000000) {
		die("File is too large.");
	} 
	/*------ Validate the file extension -----
	$allowed_ext = false;
	for($i=0; $i<sizeof($allowed_extensions); $i++){
		if(strcasecmp($allowed_extensions[$i],$type_of_uploaded_file) == 0){
			$allowed_ext = true;
		}
	}
	if(!$allowed_ext){
		$errors .= "\n O formato do arquivo enviado não é suportado. ".
		" Apenas estes formatos são suportados: ".implode(',',$allowed_extensions);
	}
	/* UPLOAD FILE VALIDATION 	
	
	//copy the temp. uploaded file to uploads folder
	$path_of_uploaded_file = $upload_folder . $name_of_uploaded_file;
	$tmp_path = $_FILES["file"]["tmp_name"];
	if(is_uploaded_file($tmp_path)){
		if(!copy($tmp_path,$path_of_uploaded_file)){
			$errors .= '\n erro durante cópia do arquivo enviado';
		}
	}
	*/
	
	$assunto;
	$type = $_REQUEST['form_nome'];;
	switch ($type) {
		case 'form_fale':
			$assunto = 'Fale Conosco';
			break;
		case 'form_trabalhe':
			$assunto = 'Trabalhe Conosco';
			break;
		case 'form_represente':
			$assunto = 'Represente';
			break;
	}
	
	$name_of_uploaded_file = basename($_FILES['file']['name']);
 	if (($_FILES['file']['error'] !== UPLOAD_ERR_OK) && ($type == 'form_trabalhe')) {
		header("refresh:5;url=/contatos.html");
		die("Upload failed with error " . $_FILES['file']['error']); 
	}
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
	
	if ($type == 'form_trabalhe'){
		$mime = finfo_file($finfo, $_FILES['file']['tmp_name']);
		$ok = false;
		switch ($mime) {
			case 'application/vnd.oasis.opendocument.text':
				$ok = true;
				break;
			case 'application/msword':
				$ok = true;
				break;
			case 'application/pdf':
				$ok = true;
				break;
			default:
				header("refresh:5;url=/contatos.html");
				die("Unknown/not permitted file type");
		}
	} else if ($type == 'form_fale' || $type == 'form_represente'){
		$ok = true;
	}
	move_uploaded_file($_FILES["file"]["tmp_name"],"./upload/" . $_FILES["file"]["name"]);
	$path_of_uploaded_file = "./upload/" . $name_of_uploaded_file;
	
	if ($ok == true){
		$nome = $_REQUEST['nome_contato'];
		$email = $_REQUEST['email_contato'];
		$telefone = $_REQUEST['telefone_contato'];
		$cargo = $_REQUEST['assunto_contato']; /* pode ser CPF, cargo de interesse ou assunto do email */
		$mensagem = $_REQUEST['mensagem'];
		$estado_contato = $_REQUEST['estado_contato'];
		$cidade_contato = $_REQUEST['cidade_contato'];
		
		$mail = new PHPMailer;
		$mail->setFrom('mailer@nh.ind.br', 'Formulario');
		
		$recipients = array(
			'eduardo.drago@nh.ind.br' => 'Eduardo',
			'novo.horizonte@nh.ind.br' => 'Flavio',
			'edson.drago@nh.ind.br' => 'Edson',
			'erikdrago1@gmail.com' => 'Erik'
		);
		
		//Identificar qual e-mail de destino
		if($_REQUEST['form_nome'] == "form_trabalhe"){
			foreach($recipients as $destination => $name){
				$mail->AddCC($destination, $name);			//criar outra variavel e mudar recipientes se desejado
			}
			$reason = "Cargo: ";
		} else if($_REQUEST['form_nome'] == "form_fale" || $_REQUEST['form_nome'] == "form_represente"){
			foreach($recipients as $destination => $name){
				$mail->AddCC($destination, $name);			//criar outra variavel e mudar recipientes se desejado
			}
			$reason = "Area de Interesse / CPF: ";
		}
		
		//Compõe o corpo da mensagem
		$mail->Subject  = 'Formulario Contatos Site';
		$mail->Body     = 'Segue em anexo as informacoes do formulario.' . "\r\n\n" ;
		$mail->Body    .= 'Formulario: ' . $assunto . "\r\n";
		$mail->Body    .= 'Nome: ' .  $nome . "\r\n";
		$mail->Body    .= 'Email: ' . $email . "\r\n";
		$mail->Body    .= 'Telefone: ' . $telefone . "\r\n";
		$mail->Body    .= $reason . $cargo . "\r\n";
		if($_REQUEST['form_nome'] == "form_represente"){
			$mail->Body    .= 'Estado Representacao: ' . $estado_contato . "\r\n";
			$mail->Body    .= 'Cidade Representacao: ' . $cidade_contato . "\r\n";
		}
		$mail->Body    .= 'Mensagem: ' . $mensagem;
		$mail->addAttachment($path_of_uploaded_file, $name_of_uploaded_file);
		
		$mail->CharSet = 'UTF-8';
		
		if($nome !=''&& $email !=''&& $telefone !=''&& $cargo !=''){
			if(!$mail->send()) {
				header("refresh:5;url=/contatos.html");
				echo 'Mensagem não enviada. Retornando para o site.';
				echo 'Mailer error: ' . $mail->ErrorInfo;
			} else {
				header("refresh:3;url=/contatos.html");
				echo 'Mensagem enviada. Retornando para o site.';
			}
		} else {
			header("refresh:3;url=/contatos.html");
			echo 'Preencha todos os campos!';
		}
	}
	
?>